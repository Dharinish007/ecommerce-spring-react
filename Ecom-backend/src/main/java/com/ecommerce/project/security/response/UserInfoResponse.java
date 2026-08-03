package com.ecommerce.project.security.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class UserInfoResponse {

    private Long id;

    private String jwtToken;

    private String username;

    private List<String> role;

    public UserInfoResponse(Long id, String username, List<String> role,String jwtToken) {
        this.id = id;
        this.jwtToken = jwtToken;
        this.username = username;
        this.role = role;
    }

    public UserInfoResponse(Long id, String username, List<String> role) {
        this.id = id;
        this.username = username;
        this.role = role;
    }
}
