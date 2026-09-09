package com.ecommerce.project.model;

public enum PaymentMethod {
    CASH_ON_DELIVERY,
    CREDIT_CARD,
    DEBIT_CARD,
    UPI,
    NET_BANKING,
    STRIPE,
    PAYPAL;

    public static PaymentMethod fromString(String text) {
        if (text == null || text.isBlank()) {
            return CASH_ON_DELIVERY;
        }
        String normalized = text.trim().replace(" ", "_").toUpperCase();
        for (PaymentMethod method : PaymentMethod.values()) {
            if (method.name().equals(normalized)) {
                return method;
            }
        }
        // Handle common shorthand aliases
        if ("COD".equalsIgnoreCase(normalized)) {
            return CASH_ON_DELIVERY;
        }
        if ("CARD".equalsIgnoreCase(normalized)) {
            return CREDIT_CARD;
        }
        return CASH_ON_DELIVERY;
    }
}
