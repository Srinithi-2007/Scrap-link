package com.scraplink.backend.service;

import com.scraplink.backend.dto.UserRequest;
import com.scraplink.backend.dto.UserResponse;
import com.scraplink.backend.entity.User;
import com.scraplink.backend.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    // CREATE USER
    public UserResponse createUser(UserRequest request) {

        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new RuntimeException("Phone number already registered");
        }

        if (request.getEmail() != null
                && !request.getEmail().isBlank()
                && userRepository.existsByEmail(request.getEmail())) {

            throw new RuntimeException("Email already registered");
        }

        User user = new User();

        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setEmail(request.getEmail());

        String hashedPassword =
                passwordEncoder.encode(request.getPassword());

        user.setPasswordHash(hashedPassword);

        user.setRole(request.getRole());
        user.setIsActive(true);

        LocalDateTime now = LocalDateTime.now();

        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        User savedUser = userRepository.save(user);

        return convertToResponse(savedUser);
    }

    // GET ALL USERS
    public List<UserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // GET USER BY ID
    public UserResponse getUserById(UUID id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with ID: " + id
                        ));

        return convertToResponse(user);
    }

    // UPDATE USER
    public UserResponse updateUser(
            UUID id,
            UserRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with ID: " + id
                        ));

        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());

        if (request.getPassword() != null
                && !request.getPassword().isBlank()) {

            String hashedPassword =
                    passwordEncoder.encode(request.getPassword());

            user.setPasswordHash(hashedPassword);
        }

        user.setUpdatedAt(LocalDateTime.now());

        User updatedUser =
                userRepository.save(user);

        return convertToResponse(updatedUser);
    }

    // DELETE USER
    public void deleteUser(UUID id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with ID: " + id
                        ));

        userRepository.delete(user);
    }

    // CONVERT USER ENTITY TO USER RESPONSE
    private UserResponse convertToResponse(User user) {

        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getEmail(),
                user.getRole(),
                user.getIsActive()
        );
    }
}