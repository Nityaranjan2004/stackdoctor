package com.personal.ChatApp.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JoinRequest {
    @NotBlank(message = "Username is required")
    private String username;
}
