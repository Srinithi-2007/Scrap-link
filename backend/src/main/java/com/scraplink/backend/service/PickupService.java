package com.scraplink.backend.service;

import com.scraplink.backend.dto.PickupResponse;
import com.scraplink.backend.entity.Pickup;
import com.scraplink.backend.entity.User;
import com.scraplink.backend.entity.enums.PickupStatus;
import com.scraplink.backend.repository.PickupRepository;
import com.scraplink.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PickupService {

    private final PickupRepository pickupRepository;
    private final UserRepository userRepository;

    public PickupService(PickupRepository pickupRepository,
                         UserRepository userRepository) {
        this.pickupRepository = pickupRepository;
        this.userRepository = userRepository;
    }

    public PickupResponse createPickup(UUID userId,
                                       String wasteDescription,
                                       String wasteCategory,
                                       Double weightKg,
                                       Double estimatedValue) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found with ID: " + userId));

        Pickup pickup = new Pickup();

        pickup.setUser(user);
        pickup.setWasteDescription(wasteDescription);
        pickup.setWasteCategory(wasteCategory);
        pickup.setWeightKg(weightKg);
        pickup.setEstimatedValue(estimatedValue);
        pickup.setStatus(PickupStatus.PENDING);
        pickup.setCreatedAt(LocalDateTime.now());

        Pickup saved = pickupRepository.save(pickup);
        return convertToResponse(saved);
    }

    public List<PickupResponse> getAllPickups() {
        return pickupRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public List<PickupResponse> getPickupsByUser(UUID userId) {
        return pickupRepository.findByUserId(userId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public PickupResponse acceptPickup(UUID pickupId) {
        Pickup pickup = pickupRepository.findById(pickupId)
                .orElseThrow(() ->
                        new RuntimeException("Pickup not found with ID: " + pickupId));

        pickup.setStatus(PickupStatus.ACCEPTED);

        Pickup updated = pickupRepository.save(pickup);
        return convertToResponse(updated);
    }

    public PickupResponse completePickup(UUID pickupId) {
        Pickup pickup = pickupRepository.findById(pickupId)
                .orElseThrow(() ->
                        new RuntimeException("Pickup not found with ID: " + pickupId));

        pickup.setStatus(PickupStatus.COMPLETED);

        Pickup updated = pickupRepository.save(pickup);
        return convertToResponse(updated);
    }

    private PickupResponse convertToResponse(Pickup pickup) {
        User user = pickup.getUser();
        UUID uId = user != null ? user.getId() : null;
        String userName = user != null ? user.getFullName() : null;
        String userPhone = user != null ? user.getPhoneNumber() : null;

        return new PickupResponse(
                pickup.getId(),
                uId,
                userName,
                userPhone,
                pickup.getWasteDescription(),
                pickup.getWasteCategory(),
                pickup.getWeightKg(),
                pickup.getEstimatedValue(),
                pickup.getStatus(),
                pickup.getCreatedAt()
        );
    }
}