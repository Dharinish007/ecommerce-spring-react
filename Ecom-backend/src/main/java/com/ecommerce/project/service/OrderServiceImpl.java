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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class OrderServiceImpl implements OrderService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "orderId", "orderDate", "totalAmount", "orderStatus"
    );

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
    public OrderDTO placeOrder(String emailId,
                              Long addressId,
                              String paymentMethod,
                              String pgName,
                              String pgPaymentId,
                              String pgStatus,
                              String pgResponseMessage) {

        User user = authUtil.loggedInUser();

        // 1. Verify address exists and belongs to the authenticated user
        Address address = addressRepository.findByAddressIdAndUserUserId(addressId, user.getUserId())
                .orElseThrow(() -> new APIException("Address not found or does not belong to the current user"));

        // 2. Fetch cart
        Cart cart = cartRepository.findCartByEmail(emailId);
        if (cart == null || cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            throw new APIException("Cart is empty. Please add items to cart before placing an order.");
        }

        List<CartItem> cartItems = new ArrayList<>(cart.getCartItems());

        // 3. Validate stock availability for all products BEFORE making any changes
        for (CartItem cartItem : cartItems) {
            Product product = productRepository.findById(cartItem.getProduct().getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", cartItem.getProduct().getProductId()));

            if (product.getQuantity() < cartItem.getQuantity()) {
                throw new APIException("Insufficient stock for product '" + product.getProductName()
                        + "'. Available: " + product.getQuantity() + ", Requested: " + cartItem.getQuantity());
            }
        }

        // 4. Create and configure Order entity
        Order order = new Order();
        order.setEmail(emailId);
        order.setUser(user);
        order.setOrderDate(LocalDateTime.now());
        order.setTotalAmount(cart.getTotalPrice() != null ? cart.getTotalPrice() : BigDecimal.ZERO);
        order.setOrderStatus(OrderStatus.CONFIRMED);
        order.setAddress(address);

        // 5. Create and configure Payment with standardized payment method
        PaymentMethod canonicalMethod = PaymentMethod.fromString(paymentMethod);
        String resolvedPgStatus = (pgStatus != null && !pgStatus.isBlank()) ? pgStatus : PaymentStatus.SUCCESS.name();
        Payment payment = new Payment(canonicalMethod.name(), pgPaymentId, resolvedPgStatus, pgResponseMessage, pgName);
        payment.setOrder(order);
        payment = paymentRepository.save(payment);
        order.setPayment(payment);

        Order savedOrder = orderRepository.save(order);

        // 6. Deduct inventory and create OrderItems
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();

            // Deduct stock safely
            product.setQuantity(product.getQuantity() - cartItem.getQuantity());
            productRepository.save(product);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setProduct(product);
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setDiscount(cartItem.getDiscount());
            orderItem.setOrderedProductPrice(cartItem.getProductPrice());

            orderItems.add(orderItem);
        }

        List<OrderItem> savedOrderItems = orderItemRepository.saveAll(orderItems);
        savedOrder.setOrderItems(savedOrderItems);

        // 7. Clear the user's cart atomically
        cartItemRepository.deleteByCartCartId(cart.getCartId());
        cart.getCartItems().clear();
        cart.setTotalPrice(BigDecimal.ZERO);
        cartRepository.save(cart);

        return mapToOrderDTO(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDTO getOrder(String emailId, Long orderId) {
        User user = authUtil.loggedInUser();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderId", orderId));

        boolean isAdmin = user.getRoles().stream()
                .anyMatch(r -> r.getRoleName().name().equals("ROLE_ADMIN"));

        if (!isAdmin && !order.getEmail().equalsIgnoreCase(user.getEmail())) {
            throw new APIException("You are not authorized to view this order.");
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

        // If order is newly cancelled, restore product stock!
        if (status == OrderStatus.CANCELLED && order.getOrderStatus() != OrderStatus.CANCELLED) {
            if (order.getOrderItems() != null) {
                for (OrderItem item : order.getOrderItems()) {
                    Product product = item.getProduct();
                    if (product != null) {
                        product.setQuantity(product.getQuantity() + item.getQuantity());
                        productRepository.save(product);
                    }
                }
            }
        }

        order.setOrderStatus(status);
        Order updatedOrder = orderRepository.save(order);
        return mapToOrderDTO(updatedOrder);
    }
}
