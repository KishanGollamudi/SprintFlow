package com.sprintflow.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI sprintFlowOpenAPI() {
        return new OpenAPI()
                // ── API Info ──────────────────────────────────────────
                .info(new Info()
                        .title("SprintFlow API")
                        .version("1.0.0")
                        .description("""
                                ## SprintFlow Backend REST API
                                
                                Multi-role sprint & attendance management system.
                                
                                ### Roles & Permissions
                                | Role        | Capabilities |
                                |-------------|-------------|
                                | **MANAGER** | Full read access, manage users (trainers/HR), view all reports |
                                | **HR**      | Create & manage sprints, manage cohorts, read attendance |
                                | **TRAINER** | Submit attendance, view assigned sprints |
                                
                                ### Authentication
                                1. Call `POST /api/auth/login` with `{ email, password }`
                                2. Copy the `accessToken` from the response `data` field
                                3. Click **Authorize** above and enter: `Bearer <your_token>`
                                4. All subsequent requests will include the token automatically
                                
                                ### Response Envelope
                                All endpoints return a consistent wrapper:
                                ```json
                                {
                                  "success": true,
                                  "message": "Human-readable message",
                                  "data": { ... },
                                  "statusCode": 200
                                }
                                ```
                                """)
                        .contact(new Contact()
                                .name("SprintFlow Team")
                                .email("admin@sprintflow.com"))
                        .license(new License()
                                .name("Internal Use Only")))

                // ── Servers ───────────────────────────────────────────
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local Development"),
                        new Server().url("https://api.sprintflow.com").description("Production")))

                // ── JWT Bearer Security Scheme ────────────────────────
                .components(new Components()
                        .addSecuritySchemes(BEARER_SCHEME, new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Paste your JWT access token here. Obtain it from POST /api/auth/login")))

                // Apply JWT globally — individual public endpoints override with []
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))

                // ── Tags (displayed as sections in Swagger UI) ────────
                .tags(List.of(
                        new Tag()
                                .name("Authentication")
                                .description("Login, logout, token refresh, and current user info. " +
                                        "**No token required for login.**"),
                        new Tag()
                                .name("Sprints")
                                .description("Sprint lifecycle management. " +
                                        "HR creates/deletes, HR+Trainer update, all roles read."),
                        new Tag()
                                .name("Attendance")
                                .description("Attendance submission and reporting. " +
                                        "Trainer submits, all roles read stats."),
                        new Tag()
                                .name("Employees")
                                .description("Employee CRUD and sprint enrollment. " +
                                        "Manager+HR manage, all roles read."),
                        new Tag()
                                .name("Users")
                                .description("Trainer and HR user management. " +
                                        "**Manager role only.** Creates users and emails credentials."),
                        new Tag()
                                .name("Messages")
                                .description("Private real-time messaging REST endpoints. " +
                                        "WebSocket STOMP endpoint: ws://localhost:8080/ws"),
                        new Tag()
                                .name("Health")
                                .description("Application health check. No authentication required."),
                        new Tag()
                                .name("Setup")
                                .description("⚠️ Development only — reset passwords. No auth required. Remove before production.")))
                .externalDocs(new ExternalDocumentation()
                        .description("SprintFlow Frontend Repository")
                        .url("http://localhost:5173"));
    }
}
