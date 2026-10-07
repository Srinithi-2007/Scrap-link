package com.scraplink.backend.controller;

import com.scraplink.backend.dto.PickupResponse;
import com.scraplink.backend.service.PickupService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pickups")
public class PickupController {

    private final PickupService pickupService;

    public PickupController(PickupService pickupService) {
        this.pickupService = pickupService;
    }

    @PostMapping
    public PickupResponse createPickup(
            @RequestParam UUID userId,
            @RequestParam String wasteDescription,
            @RequestParam String wasteCategory,
            @RequestParam Double weightKg,
            @RequestParam Double estimatedValue) {

        return pickupService.createPickup(
                userId,
                wasteDescription,
                wasteCategory,
                weightKg,
                estimatedValue
        );
    }

    @GetMapping
    public List<PickupResponse> getAllPickups() {
        return pickupService.getAllPickups();
    }

    @GetMapping("/user/{userId}")
    public List<PickupResponse> getPickupsByUser(@PathVariable UUID userId) {
        return pickupService.getPickupsByUser(userId);
    }

    @PutMapping("/{pickupId}/accept")
    public PickupResponse acceptPickup(@PathVariable UUID pickupId) {
        return pickupService.acceptPickup(pickupId);
    }

    @PutMapping("/{pickupId}/complete")
    public PickupResponse completePickup(@PathVariable UUID pickupId) {
        return pickupService.completePickup(pickupId);
    }
}