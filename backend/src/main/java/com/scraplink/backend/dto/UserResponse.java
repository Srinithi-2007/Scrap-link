package com.scraplink.backend.dto;

import com.scraplink.backend.entity.enums.UserRole;

import java.util.UUID;

public class UserResponse {

    private UUID id;
    private String fullName;
    private String phoneNumber;
    private String email;
    private UserRole role;
    private Boolean isActive;

    public UserResponse() {
    }

    public UserResponse(
            UUID id,
            String fullName,
            String phoneNumber,
            String email,
            UserRole role,
            Boolean isActive) {

        this.id = id;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.role = role;
        this.isActive = isActive;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}