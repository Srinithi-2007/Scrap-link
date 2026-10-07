package com.scraplink.backend.dto;

import com.scraplink.backend.entity.enums.PickupStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public class PickupResponse {

    private UUID id;
    private UUID userId;
    private String userName;
    private String userPhone;
    private String wasteDescription;
    private String wasteCategory;
    private Double weightKg;
    private Double estimatedValue;
    private PickupStatus status;
    private LocalDateTime createdAt;

    public PickupResponse() {
    }

    public PickupResponse(
            UUID id,
            UUID userId,
            String userName,
            String userPhone,
            String wasteDescription,
            String wasteCategory,
            Double weightKg,
            Double estimatedValue,
            PickupStatus status,
            LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.userPhone = userPhone;
        this.wasteDescription = wasteDescription;
        this.wasteCategory = wasteCategory;
        this.weightKg = weightKg;
        this.estimatedValue = estimatedValue;
        this.status = status;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserPhone() {
        return userPhone;
    }

    public void setUserPhone(String userPhone) {
        this.userPhone = userPhone;
    }

    public String getWasteDescription() {
        return wasteDescription;
    }

    public void setWasteDescription(String wasteDescription) {
        this.wasteDescription = wasteDescription;
    }

    public String getWasteCategory() {
        return wasteCategory;
    }

    public void setWasteCategory(String wasteCategory) {
        this.wasteCategory = wasteCategory;
    }

    public Double getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(Double weightKg) {
        this.weightKg = weightKg;
    }

    public Double getEstimatedValue() {
        return estimatedValue;
    }

    public void setEstimatedValue(Double estimatedValue) {
        this.estimatedValue = estimatedValue;
    }

    public PickupStatus getStatus() {
        return status;
    }

    public void setStatus(PickupStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
