package com.ecommerce.project.security.response;

import com.ecommerce.project.security.request.SignupRequest;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class MessageResponse {
    private String message;

    public MessageResponse(String message) {
        this.message = message;
    }

}
