package com.scraplink.backend.repository;

import com.scraplink.backend.entity.Pickup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PickupRepository extends JpaRepository<Pickup, UUID> {

    List<Pickup> findByUserId(UUID userId);
}