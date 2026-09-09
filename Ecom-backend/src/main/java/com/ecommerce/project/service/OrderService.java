package com.ecommerce.project.service;

import com.ecommerce.project.model.OrderStatus;
import com.ecommerce.project.payload.OrderDTO;
import com.ecommerce.project.payload.OrderResponse;

public interface OrderService {
    OrderDTO placeOrder(String emailId, Long addressId, String paymentMethod, String pgName, String pgPaymentId, String pgStatus, String pgResponseMessage);

    OrderDTO getOrder(String emailId, Long orderId);

    OrderResponse getAllOrders(Integer pageNumber, Integer pageSize, String sortBy, String sortOrder);

    OrderResponse getOrdersByUser(String emailId, Integer pageNumber, Integer pageSize, String sortBy, String sortOrder);

    OrderDTO updateOrderStatus(Long orderId, OrderStatus status);
}
