package com.scraplink.backend.entity;

import com.scraplink.backend.entity.enums.PickupStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "pickups")
public class Pickup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "waste_description", nullable = false)
    private String wasteDescription;

    @Column(name = "waste_category", nullable = false)
    private String wasteCategory;

    @Column(name = "weight_kg", nullable = false)
    private Double weightKg;

    @Column(name = "estimated_value", nullable = false)
    private Double estimatedValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PickupStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Pickup() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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