package com.ecommerce.project.service;

import com.ecommerce.project.exception.APIException;
import com.ecommerce.project.exception.ResourceNotFoundException;
import com.ecommerce.project.model.*;
import com.ecommerce.project.payload.*;
import com.ecommerce.project.repositories.*;
import com.ecommerce.project.util.AuthUtil;
import com.ecommerce.project.util.SortUtils;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class OrderServiceImpl implements OrderService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "orderId", "orderDate", "totalAmount", "orderStatus"
    );

    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("499.00");
    private static final BigDecimal STANDARD_SHIPPING_FEE = new BigDecimal("49.00");

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final AddressRepository addressRepository;
    private final PaymentRepository paymentRepository;
    private final ModelMapper modelMapper;
    private final AuthUtil authUtil;

    public OrderServiceImpl(CartRepository cartRepository,
                            CartItemRepository cartItemRepository,
                            OrderRepository orderRepository,
                            OrderItemRepository orderItemRepository,
                            ProductRepository productRepository,
                            AddressRepository addressRepository,
                            PaymentRepository paymentRepository,
                            ModelMapper modelMapper,
                            AuthUtil authUtil) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.addressRepository = addressRepository;
        this.paymentRepository = paymentRepository;
        this.modelMapper = modelMapper;
        this.authUtil = authUtil;
    }

    private OrderDTO mapToOrderDTO(Order order) {
        OrderDTO orderDTO = modelMapper.map(order, OrderDTO.class);
        orderDTO.setShippingFee(order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO);
        if (order.getAddress() != null) {
            orderDTO.setAddressId(order.getAddress().getAddressId());
            orderDTO.setAddress(modelMapper.map(order.getAddress(), AddressDTO.class));
        }
        if (order.getPayment() != null) {
            orderDTO.setPayment(modelMapper.map(order.getPayment(), PaymentDTO.class));
        }
        List<OrderItemDTO> orderItemDTOs = new ArrayList<>();
        if (order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                OrderItemDTO itemDTO = modelMapper.map(item, OrderItemDTO.class);
                if (item.getProduct() != null) {
                    ProductDTO productDTO = modelMapper.map(item.getProduct(), ProductDTO.class);
                    if (item.getProductName() != null && !item.getProductName().isBlank()) {
                        productDTO.setProductName(item.getProductName());
                    }
                    if (item.getProductImage() != null && !item.getProductImage().isBlank()) {
                        productDTO.setImage(item.getProductImage());
                    }
                    itemDTO.setProduct(productDTO);
                } else {
                    ProductDTO productDTO = new ProductDTO();
                    productDTO.setPrice(item.getOrderedProductPrice());
                    productDTO.setSpecialPrice(item.getOrderedProductPrice());
                    itemDTO.setProduct(productDTO);
                }
                orderItemDTOs.add(itemDTO);
            }
        }
        orderDTO.setOrderItems(orderItemDTOs);
        return orderDTO;
    }

    @Override
    @Transactional
    public OrderDTO placeOrder(String emailId, OrderRequestDTO orderRequestDTO, String paymentMethodPath) {
        // 0. Idempotency / network retry check using pgPaymentId if supplied
        String reqPaymentId = orderRequestDTO.getPgPaymentId();
        if (reqPaymentId != null && !reqPaymentId.isBlank()) {
            Optional<Payment> existingPayment = paymentRepository.findByPgPaymentId(reqPaymentId);
            if (existingPayment.isPresent() && existingPayment.get().getOrder() != null) {
                return mapToOrderDTO(existingPayment.get().getOrder());
            }
        }

        User user = authUtil.loggedInUser();

        // 1. Verify address exists and belongs to the authenticated user
        Address address = addressRepository.findByAddressIdAndUserUserId(orderRequestDTO.getAddressId(), user.getUserId())
                .orElseThrow(() -> new APIException("Address not found or does not belong to the current user"));

        // 2. Fetch cart with PESSIMISTIC_WRITE lock to serialize concurrent checkouts and prevent duplicate orders
        Cart cart = cartRepository.findCartByEmailForUpdate(emailId)
                .orElseThrow(() -> new APIException("Cart not found for user: " + emailId));

        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            throw new APIException("Cart is empty. Please add items to cart before placing an order.");
        }

        List<CartItem> cartItems = new ArrayList<>(cart.getCartItems());

        // 3. Authoritative stock pre-validation and items total calculation directly from database products
        BigDecimal itemsTotal = BigDecimal.ZERO;
        for (CartItem cartItem : cartItems) {
            Product product = productRepository.findById(cartItem.getProduct().getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", cartItem.getProduct().getProductId()));

            if (product.getQuantity() < cartItem.getQuantity()) {
                throw new APIException("Insufficient stock for product '" + product.getProductName()
                        + "'. Available: " + product.getQuantity() + ", Requested: " + cartItem.getQuantity());
            }

            BigDecimal unitPrice = (product.getSpecialPrice() != null && product.getSpecialPrice().compareTo(BigDecimal.ZERO) > 0)
                    ? product.getSpecialPrice()
                    : product.getPrice();

            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            itemsTotal = itemsTotal.add(lineTotal);
        }

        // 4. Server-authoritative shipping fee calculation (Free over ₹499, otherwise ₹49)
        BigDecimal shippingFee = (itemsTotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0)
                ? BigDecimal.ZERO
                : STANDARD_SHIPPING_FEE;
        BigDecimal grandTotal = itemsTotal.add(shippingFee);

        // 5. Server-controlled Demo Payment Flow
        String requestedMethod = (paymentMethodPath != null && !paymentMethodPath.isBlank())
                ? paymentMethodPath
                : orderRequestDTO.getPaymentMethod();
        PaymentMethod canonicalMethod = PaymentMethod.fromString(requestedMethod);

        boolean isSimulatedFailure = Boolean.TRUE.equals(orderRequestDTO.getSimulateFailure())
                || "FAILED".equalsIgnoreCase(orderRequestDTO.getPgStatus());

        if (isSimulatedFailure) {
            throw new APIException("Payment processing failed: Simulated payment decline. Please verify your payment details or choose another method.");
        }

        String pgStatus;
        String pgPaymentId;
        String pgResponseMessage;
        String pgName;

        if (canonicalMethod == PaymentMethod.CASH_ON_DELIVERY) {
            pgStatus = PaymentStatus.PENDING.name();
            pgName = "Cash on Delivery";
            pgPaymentId = "COD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            pgResponseMessage = "Payment will be collected upon delivery.";
        } else {
            pgStatus = PaymentStatus.SUCCESS.name();
            pgName = canonicalMethod.name() + " (Demo Gateway)";
            pgPaymentId = (orderRequestDTO.getPgPaymentId() != null && !orderRequestDTO.getPgPaymentId().isBlank())
                    ? orderRequestDTO.getPgPaymentId()
                    : "DEMO-TXN-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            pgResponseMessage = "Demo payment authorized and captured successfully.";
        }

        // 6. Create Order and Payment entities
        Order order = new Order();
        order.setEmail(emailId);
        order.setUser(user);
        order.setOrderDate(LocalDateTime.now());
        order.setShippingFee(shippingFee);
        order.setTotalAmount(grandTotal);
        order.setOrderStatus(OrderStatus.CONFIRMED);
        order.setAddress(address);

        Payment payment = new Payment(canonicalMethod.name(), pgPaymentId, pgStatus, pgResponseMessage, pgName);
        payment.setOrder(order);
        payment = paymentRepository.save(payment);
        order.setPayment(payment);

        Order savedOrder = orderRepository.save(order);

        // 7. Deduct inventory atomically to prevent overselling race conditions, and create OrderItems
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();

            int updatedRows = productRepository.deductStock(product.getProductId(), cartItem.getQuantity());
            if (updatedRows == 0) {
                throw new APIException("Insufficient stock for product '" + product.getProductName()
                        + "'. Another customer just completed checkout for this item.");
            }

            BigDecimal unitPrice = (product.getSpecialPrice() != null && product.getSpecialPrice().compareTo(BigDecimal.ZERO) > 0)
                    ? product.getSpecialPrice()
                    : product.getPrice();

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setProduct(product);
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setDiscount(product.getDiscount() != null ? product.getDiscount() : BigDecimal.ZERO);
            orderItem.setOrderedProductPrice(unitPrice);

            orderItems.add(orderItem);
        }

        List<OrderItem> savedOrderItems = orderItemRepository.saveAll(orderItems);
        savedOrder.setOrderItems(savedOrderItems);

        // 8. Clear the user's cart atomically
        cartItemRepository.deleteByCartCartId(cart.getCartId());
        cart.getCartItems().clear();
        cart.setTotalPrice(BigDecimal.ZERO);
        cartRepository.save(cart);

        return mapToOrderDTO(savedOrder);
    }

    @Override
    @Transactional
    public OrderDTO placeOrder(String emailId,
                              Long addressId,
                              String paymentMethod,
                              String pgName,
                              String pgPaymentId,
                              String pgStatus,
                              String pgResponseMessage) {
        OrderRequestDTO dto = new OrderRequestDTO(addressId, paymentMethod, pgName, pgPaymentId, pgStatus, pgResponseMessage, false);
        return placeOrder(emailId, dto, paymentMethod);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDTO getOrder(String emailId, Long orderId) {
        User user = authUtil.loggedInUser();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderId", orderId));

        boolean isAdmin = user.getRoles().stream()
                .anyMatch(r -> r.getRoleName().name().equals("ROLE_ADMIN"));

        if (!isAdmin && (order.getEmail() == null || !order.getEmail().equalsIgnoreCase(user.getEmail()))) {
            throw new AccessDeniedException("You are not authorized to view this order.");
        }

        return mapToOrderDTO(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getAllOrders(Integer pageNumber, Integer pageSize, String sortBy, String sortOrder) {
        Sort sortByAndOrder = SortUtils.createSafeSort(sortBy, sortOrder, ALLOWED_SORT_FIELDS, "orderDate");
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sortByAndOrder);

        Page<Order> orderPage = orderRepository.findAll(pageable);
        List<OrderDTO> orderDTOs = orderPage.getContent().stream().map(this::mapToOrderDTO).toList();

        OrderResponse orderResponse = new OrderResponse();
        orderResponse.setContent(orderDTOs);
        orderResponse.setPageNumber(orderPage.getNumber());
        orderResponse.setPageSize(orderPage.getSize());
        orderResponse.setTotalElements(orderPage.getTotalElements());
        orderResponse.setTotalPages(orderPage.getTotalPages());
        orderResponse.setLastPage(orderPage.isLast());

        return orderResponse;
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrdersByUser(String emailId, Integer pageNumber, Integer pageSize, String sortBy, String sortOrder) {
        Sort sortByAndOrder = SortUtils.createSafeSort(sortBy, sortOrder, ALLOWED_SORT_FIELDS, "orderDate");
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sortByAndOrder);

        Page<Order> orderPage = orderRepository.findByEmail(emailId, pageable);
        List<OrderDTO> orderDTOs = orderPage.getContent().stream().map(this::mapToOrderDTO).toList();

        OrderResponse orderResponse = new OrderResponse();
        orderResponse.setContent(orderDTOs);
        orderResponse.setPageNumber(orderPage.getNumber());
        orderResponse.setPageSize(orderPage.getSize());
        orderResponse.setTotalElements(orderPage.getTotalElements());
        orderResponse.setTotalPages(orderPage.getTotalPages());
        orderResponse.setLastPage(orderPage.isLast());

        return orderResponse;
    }

    @Override
    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderId", orderId));

        if (order.getOrderStatus() == OrderStatus.DELIVERED && status != OrderStatus.DELIVERED) {
            throw new APIException("Delivered orders cannot transition to any other status.");
        }

        if (order.getOrderStatus() == OrderStatus.CANCELLED && status != OrderStatus.CANCELLED) {
            throw new APIException("Cancelled orders cannot be reopened.");
        }

        // If order is newly cancelled, restore product stock atomically and void payment!
        if (status == OrderStatus.CANCELLED && order.getOrderStatus() != OrderStatus.CANCELLED) {
            if (order.getOrderItems() != null) {
                for (OrderItem item : order.getOrderItems()) {
                    Product product = item.getProduct();
                    if (product != null) {
                        productRepository.restoreStock(product.getProductId(), item.getQuantity());
                    }
                }
            }
            if (order.getPayment() != null) {
                order.getPayment().setPgStatus(PaymentStatus.FAILED.name());
                order.getPayment().setPgResponseMessage("Order was cancelled. Payment voided/refunded.");
                paymentRepository.save(order.getPayment());
            }
        }

        // If COD order transitions to DELIVERED, automatically mark payment as SUCCESS
        if (status == OrderStatus.DELIVERED && order.getOrderStatus() != OrderStatus.DELIVERED) {
            if (order.getPayment() != null && PaymentMethod.fromString(order.getPayment().getPaymentMethod()) == PaymentMethod.CASH_ON_DELIVERY) {
                order.getPayment().setPgStatus(PaymentStatus.SUCCESS.name());
                order.getPayment().setPgResponseMessage("Cash collected upon delivery.");
                paymentRepository.save(order.getPayment());
            }
        }

        order.setOrderStatus(status);
        Order updatedOrder = orderRepository.save(order);
        return mapToOrderDTO(updatedOrder);
    }
}
