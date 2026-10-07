package com.scraplink.backend.controller;

import com.scraplink.backend.dto.UserRequest;
import com.scraplink.backend.dto.UserResponse;
import com.scraplink.backend.entity.enums.UserRole;
import com.scraplink.backend.service.UserService;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Scanner;
import java.util.UUID;

@Component
public class ConsoleController {

    private final UserService userService;
    private final Scanner scanner;

    public ConsoleController(UserService userService) {
        this.userService = userService;
        this.scanner = new Scanner(System.in);
    }

    public void start() {

        boolean running = true;

        while (running) {

            showMenu();

            String choice = scanner.nextLine();

            switch (choice) {

                case "1":
                    registerUser();
                    break;

                case "2":
                    viewAllUsers();
                    break;

                case "7":
                    running = false;
                    System.out.println();
                    System.out.println("Thank you for using Scrap Link!");
                    System.out.println("♻ Keep recycling. Keep the planet clean. ♻");
                    break;

                default:
                    System.out.println();
                    System.out.println("Invalid choice. Please try again.");
            }
        }
    }

    private void showMenu() {

        System.out.println();
        System.out.println("====================================================");
        System.out.println("                 ♻ SCRAP LINK ♻");
        System.out.println("       AI-Powered Waste Collection Platform");
        System.out.println("====================================================");
        System.out.println();
        System.out.println("  1. Register User");
        System.out.println("  2. View All Users");
        System.out.println("  3. Book Scrap Pickup");
        System.out.println("  4. Classify Waste");
        System.out.println("  5. Estimate Scrap Price");
        System.out.println("  6. View Pickup Summary");
        System.out.println("  7. Exit");
        System.out.println();
        System.out.print("Enter your choice: ");
    }

    private void registerUser() {

        System.out.println();
        System.out.println("--------------- REGISTER USER ---------------");

        System.out.print("Enter Full Name     : ");
        String fullName = scanner.nextLine();

        System.out.print("Enter Phone Number  : ");
        String phoneNumber = scanner.nextLine();

        System.out.print("Enter Email         : ");
        String email = scanner.nextLine();

        System.out.print("Enter Password      : ");
        String password = scanner.nextLine();

        System.out.println();
        System.out.println("Select Role:");
        System.out.println("1. GENERATOR");
        System.out.println("2. COLLECTOR");

        System.out.print("Enter role          : ");
        String roleChoice = scanner.nextLine();

        UserRole role;

        if (roleChoice.equals("2")) {
            role = UserRole.COLLECTOR;
        } else {
            role = UserRole.GENERATOR;
        }

        try {

            UserRequest request = new UserRequest(
                    fullName,
                    phoneNumber,
                    email,
                    password,
                    role
            );

            UserResponse response =
                    userService.createUser(request);

            System.out.println();
            System.out.println("User registered successfully!");
            System.out.println();
            System.out.println("User ID     : " + response.getId());
            System.out.println("Name        : " + response.getFullName());
            System.out.println("Phone       : " + response.getPhoneNumber());
            System.out.println("Email       : " + response.getEmail());
            System.out.println("Role        : " + response.getRole());
            System.out.println("Status      : " +
                    (response.getIsActive() ? "ACTIVE" : "INACTIVE"));

        } catch (Exception e) {

            System.out.println();
            System.out.println("[ERROR] " + e.getMessage());
        }
    }

    private void viewAllUsers() {

        System.out.println();
        System.out.println("--------------- REGISTERED USERS ---------------");

        try {

            List<UserResponse> users =
                    userService.getAllUsers();

            if (users.isEmpty()) {

                System.out.println();
                System.out.println("No users registered yet.");
                return;
            }

            System.out.println();

            for (UserResponse user : users) {

                System.out.println("----------------------------------------------");
                System.out.println("ID       : " + user.getId());
                System.out.println("Name     : " + user.getFullName());
                System.out.println("Phone    : " + user.getPhoneNumber());
                System.out.println("Email    : " + user.getEmail());
                System.out.println("Role     : " + user.getRole());
                System.out.println("Status   : " +
                        (user.getIsActive() ? "ACTIVE" : "INACTIVE"));
            }

            System.out.println("----------------------------------------------");
            System.out.println("Total Users: " + users.size());

        } catch (Exception e) {

            System.out.println();
            System.out.println("[ERROR] " + e.getMessage());
        }
    }
}