package com.ecommerce.project.service;

import com.ecommerce.project.exception.APIException;
import com.ecommerce.project.model.*;
import com.ecommerce.project.payload.OrderDTO;
import com.ecommerce.project.payload.OrderRequestDTO;
import com.ecommerce.project.repositories.*;
import com.ecommerce.project.util.AuthUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.modelmapper.ModelMapper;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class OrderServiceCheckoutTest {

    private CartRepository cartRepository;
    private CartItemRepository cartItemRepository;
    private OrderRepository orderRepository;
    private OrderItemRepository orderItemRepository;
    private ProductRepository productRepository;
    private AddressRepository addressRepository;
    private PaymentRepository paymentRepository;
    private AuthUtil authUtil;
    private OrderServiceImpl orderService;

    private User testUser;
    private Address testAddress;

    @BeforeEach
    void setUp() {
        cartRepository = Mockito.mock(CartRepository.class);
        cartItemRepository = Mockito.mock(CartItemRepository.class);
        orderRepository = Mockito.mock(OrderRepository.class);
        orderItemRepository = Mockito.mock(OrderItemRepository.class);
        productRepository = Mockito.mock(ProductRepository.class);
        addressRepository = Mockito.mock(AddressRepository.class);
        paymentRepository = Mockito.mock(PaymentRepository.class);
        authUtil = Mockito.mock(AuthUtil.class);
        ModelMapper modelMapper = new ModelMapper();

        orderService = new OrderServiceImpl(
                cartRepository,
                cartItemRepository,
                orderRepository,
                orderItemRepository,
                productRepository,
                addressRepository,
                paymentRepository,
                modelMapper,
                authUtil
        );

        testUser = new User();
        testUser.setUserId(1L);
        testUser.setEmail("buyer@example.com");
        testUser.setUserName("buyer");

        testAddress = new Address();
        testAddress.setAddressId(10L);
        testAddress.setUser(testUser);
        testAddress.setBuildingName("Flat 101");
        testAddress.setStreet("Main Street");
        testAddress.setCity("Metropolis");
        testAddress.setState("State");
        testAddress.setPincode("123456");
        testAddress.setCountry("India");

        when(authUtil.loggedInUser()).thenReturn(testUser);
        when(addressRepository.findByAddressIdAndUserUserId(10L, 1L)).thenReturn(Optional.of(testAddress));
        when(orderItemRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));
    }

    private Product createProduct(Long id, String name, int quantity, BigDecimal price, BigDecimal specialPrice) {
        Product p = new Product();
        p.setProductId(id);
        p.setProductName(name);
        p.setQuantity(quantity);
        p.setPrice(price);
        p.setSpecialPrice(specialPrice);
        p.setDiscount(BigDecimal.ZERO);
        return p;
    }

    private Cart createCartWithItem(Product product, int quantity) {
        Cart cart = new Cart();
        cart.setCartId(50L);
        cart.setUser(testUser);

        CartItem item = new CartItem();
        item.setCartItemId(100L);
        item.setCart(cart);
        item.setProduct(product);
        item.setQuantity(quantity);
        item.setProductPrice(product.getSpecialPrice() != null ? product.getSpecialPrice() : product.getPrice());

        cart.setCartItems(new ArrayList<>(List.of(item)));
        cart.setTotalPrice(item.getProductPrice().multiply(BigDecimal.valueOf(quantity)));
        return cart;
    }

    // --- 1. Authoritative Totals & Shipping Calculation Tests ---

    @Test
    void testPlaceOrder_CalculatesShippingFeeWhenBelowThreshold() {
        // Items subtotal: 1 * 300 = 300 (< 499 threshold), shipping should be 49, total 349
        Product product = createProduct(1L, "T-Shirt", 10, new BigDecimal("300.00"), new BigDecimal("300.00"));
        Cart cart = createCartWithItem(product, 1);

        when(cartRepository.findCartByEmailForUpdate("buyer@example.com")).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.deductStock(1L, 1)).thenReturn(1);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
            Order o = i.getArgument(0);
            o.setOrderId(1001L);
            return o;
        });

        OrderRequestDTO request = new OrderRequestDTO(10L, "COD", null, null, null, null, false);
        OrderDTO result = orderService.placeOrder("buyer@example.com", request, "COD");

        assertNotNull(result);
        assertEquals(new BigDecimal("49.00"), result.getShippingFee());
        assertEquals(new BigDecimal("349.00"), result.getTotalAmount());
    }

    @Test
    void testPlaceOrder_FreeShippingWhenAtOrAboveThreshold() {
        // Items subtotal: 2 * 300 = 600 (>= 499 threshold), shipping should be 0, total 600
        Product product = createProduct(1L, "Sneakers", 10, new BigDecimal("300.00"), new BigDecimal("300.00"));
        Cart cart = createCartWithItem(product, 2);

        when(cartRepository.findCartByEmailForUpdate("buyer@example.com")).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.deductStock(1L, 2)).thenReturn(1);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
            Order o = i.getArgument(0);
            o.setOrderId(1002L);
            return o;
        });

        OrderRequestDTO request = new OrderRequestDTO(10L, "UPI", null, null, null, null, false);
        OrderDTO result = orderService.placeOrder("buyer@example.com", request, "UPI");

        assertNotNull(result);
        assertEquals(BigDecimal.ZERO, result.getShippingFee());
        assertEquals(new BigDecimal("600.00"), result.getTotalAmount());
    }

    // --- 2. Payment Control & Verification Tests ---

    @Test
    void testPlaceOrder_CodSetsPaymentStatusToPendingEvenIfClientSendsSuccess() {
        Product product = createProduct(1L, "Book", 5, new BigDecimal("500.00"), new BigDecimal("500.00"));
        Cart cart = createCartWithItem(product, 1);

        when(cartRepository.findCartByEmailForUpdate("buyer@example.com")).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.deductStock(1L, 1)).thenReturn(1);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
            Order o = i.getArgument(0);
            o.setOrderId(1003L);
            return o;
        });

        // Client passes pgStatus: "SUCCESS"
        OrderRequestDTO request = new OrderRequestDTO(10L, "COD", "FakePG", "FAKE-123", "SUCCESS", "Fake success", false);
        OrderDTO result = orderService.placeOrder("buyer@example.com", request, "COD");

        assertNotNull(result);
        assertNotNull(result.getPayment());
        // Backend must override client-supplied "SUCCESS" to PENDING for COD
        assertEquals(PaymentStatus.PENDING.name(), result.getPayment().getPgStatus());
        assertEquals("Cash on Delivery", result.getPayment().getPgName());
        assertTrue(result.getPayment().getPgPaymentId().startsWith("COD-"));
    }

    @Test
    void testPlaceOrder_SimulatedFailureRejectsCheckoutAndRollsBack() {
        Product product = createProduct(1L, "Watch", 5, new BigDecimal("1000.00"), new BigDecimal("1000.00"));
        Cart cart = createCartWithItem(product, 1);

        when(cartRepository.findCartByEmailForUpdate("buyer@example.com")).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        // Client specifies simulated payment failure
        OrderRequestDTO request = new OrderRequestDTO(10L, "Credit Card", null, null, null, null, true);

        APIException ex = assertThrows(APIException.class, () ->
                orderService.placeOrder("buyer@example.com", request, "Credit Card")
        );

        assertTrue(ex.getMessage().contains("Payment processing failed: Simulated payment decline"));
        // Ensure no stock was deducted and no order was saved
        verify(productRepository, never()).deductStock(any(), any());
        verify(orderRepository, never()).save(any());
        verify(cartItemRepository, never()).deleteByCartCartId(any());
    }

    // --- 3. Inventory Concurrency & Anti-Overselling Tests ---

    @Test
    void testPlaceOrder_PreCheckRejectsWhenStockInsufficient() {
        Product product = createProduct(1L, "Laptop", 1, new BigDecimal("50000.00"), new BigDecimal("50000.00"));
        // Requested 2 but only 1 available
        Cart cart = createCartWithItem(product, 2);

        when(cartRepository.findCartByEmailForUpdate("buyer@example.com")).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        OrderRequestDTO request = new OrderRequestDTO(10L, "UPI", null, null, null, null, false);
        APIException ex = assertThrows(APIException.class, () ->
                orderService.placeOrder("buyer@example.com", request, "UPI")
        );

        assertTrue(ex.getMessage().contains("Insufficient stock for product 'Laptop'"));
        verify(productRepository, never()).deductStock(any(), any());
    }

    @Test
    void testPlaceOrder_AtomicDeductionFailureRejectsConcurrentCheckout() {
        Product product = createProduct(1L, "Phone", 1, new BigDecimal("20000.00"), new BigDecimal("20000.00"));
        Cart cart = createCartWithItem(product, 1);

        when(cartRepository.findCartByEmailForUpdate("buyer@example.com")).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        // Atomic deduction returns 0 (another concurrent thread took the last unit!)
        when(productRepository.deductStock(1L, 1)).thenReturn(0);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderRequestDTO request = new OrderRequestDTO(10L, "UPI", null, null, null, null, false);
        APIException ex = assertThrows(APIException.class, () ->
                orderService.placeOrder("buyer@example.com", request, "UPI")
        );

        assertTrue(ex.getMessage().contains("Another customer just completed checkout for this item"));
        // Cart must NOT be deleted
        verify(cartItemRepository, never()).deleteByCartCartId(any());
    }

    // --- 4. Duplicate Checkout & Idempotency Tests ---

    @Test
    void testPlaceOrder_RejectsWhenCartIsEmpty() {
        Cart emptyCart = new Cart();
        emptyCart.setCartId(99L);
        emptyCart.setCartItems(Collections.emptyList());

        when(cartRepository.findCartByEmailForUpdate("buyer@example.com")).thenReturn(Optional.of(emptyCart));

        OrderRequestDTO request = new OrderRequestDTO(10L, "COD", null, null, null, null, false);
        APIException ex = assertThrows(APIException.class, () ->
                orderService.placeOrder("buyer@example.com", request, "COD")
        );

        assertTrue(ex.getMessage().contains("Cart is empty"));
    }

    @Test
    void testPlaceOrder_ReturnsExistingOrderOnRetriedPgPaymentId() {
        String existingTxnId = "DEMO-TXN-123456";
        Order existingOrder = new Order();
        existingOrder.setOrderId(999L);
        existingOrder.setEmail("buyer@example.com");
        existingOrder.setTotalAmount(new BigDecimal("549.00"));
        existingOrder.setOrderStatus(OrderStatus.CONFIRMED);

        Payment existingPayment = new Payment("UPI", existingTxnId, "SUCCESS", "Captured", "Demo Gateway");
        existingPayment.setOrder(existingOrder);
        existingOrder.setPayment(existingPayment);

        when(paymentRepository.findByPgPaymentId(existingTxnId)).thenReturn(Optional.of(existingPayment));

        OrderRequestDTO request = new OrderRequestDTO(10L, "UPI", "Demo Gateway", existingTxnId, "SUCCESS", "Captured", false);
        OrderDTO result = orderService.placeOrder("buyer@example.com", request, "UPI");

        assertNotNull(result);
        assertEquals(999L, result.getOrderId());
        verify(orderRepository, never()).save(any());
    }

    // --- 5. Order Cancellation Stock Restoration Tests ---

    @Test
    void testUpdateOrderStatus_RestoresStockAtomicallyOnCancellation() {
        Product product = createProduct(1L, "Tablet", 5, new BigDecimal("15000.00"), new BigDecimal("15000.00"));

        Order order = new Order();
        order.setOrderId(555L);
        order.setOrderStatus(OrderStatus.CONFIRMED);

        Payment payment = new Payment("UPI", "TXN-1", "SUCCESS", "Captured", "Gateway");
        order.setPayment(payment);

        OrderItem item = new OrderItem();
        item.setOrderItemId(11L);
        item.setProduct(product);
        item.setQuantity(2);
        order.setOrderItems(List.of(item));

        when(orderRepository.findById(555L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderDTO updated = orderService.updateOrderStatus(555L, OrderStatus.CANCELLED);

        assertNotNull(updated);
        assertEquals(OrderStatus.CANCELLED, updated.getOrderStatus());
        // Verify atomic restore was called with productId=1 and quantity=2
        verify(productRepository, times(1)).restoreStock(1L, 2);
        // Verify payment was marked as FAILED/voided
        assertEquals(PaymentStatus.FAILED.name(), payment.getPgStatus());
        verify(paymentRepository, times(1)).save(payment);
    }
}
