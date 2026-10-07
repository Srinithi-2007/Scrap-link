package com.scraplink.backend.dto;

import com.scraplink.backend.entity.enums.UserRole;

public class UserRequest {

    private String fullName;
    private String phoneNumber;
    private String email;
    private String password;
    private UserRole role;

    public UserRequest() {
    }

    public UserRequest(
            String fullName,
            String phoneNumber,
            String email,
            String password,
            UserRole role) {

        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.password = password;
        this.role = role;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }
}