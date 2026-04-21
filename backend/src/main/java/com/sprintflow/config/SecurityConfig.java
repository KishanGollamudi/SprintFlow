package com.sprintflow.config;

import com.sprintflow.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.beans.factory.annotation.Value;
import java.util.Arrays;
import java.util.List;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity   // enables @PreAuthorize on @MessageMapping and REST methods
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Allow CORS preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/health/**").permitAll()
                .requestMatchers("/api/setup/**").permitAll()
                // Swagger UI + OpenAPI spec
                .requestMatchers(
                    "/swagger-ui.html",
                    "/swagger-ui/**",
                    "/v3/api-docs",
                    "/v3/api-docs/**",
                    "/swagger-resources/**",
                    "/webjars/**"
                ).permitAll()
                // WebSocket handshake (SockJS)
                .requestMatchers("/ws/**").permitAll()

                // Sprints — all roles read; HR + MANAGER create/delete; HR + MANAGER + TRAINER update
                .requestMatchers(HttpMethod.GET,    "/api/sprints/**").hasAnyRole("MANAGER", "HR", "TRAINER")
                .requestMatchers(HttpMethod.POST,   "/api/sprints").hasAnyRole("HR", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/sprints/**").hasAnyRole("HR", "MANAGER")
                .requestMatchers(HttpMethod.PUT,    "/api/sprints/**").hasAnyRole("HR", "TRAINER", "MANAGER")
                .requestMatchers(HttpMethod.PATCH,  "/api/sprints/**").hasAnyRole("HR", "TRAINER", "MANAGER")

                // Attendance — trainer submits; manager + HR + trainer read
                .requestMatchers(HttpMethod.POST,  "/api/attendance/**").hasAnyRole("TRAINER", "MANAGER")
                .requestMatchers(HttpMethod.PATCH, "/api/attendance/**").hasAnyRole("TRAINER", "MANAGER")
                .requestMatchers(HttpMethod.GET,   "/api/attendance/**").hasAnyRole("MANAGER", "HR", "TRAINER")

                // Employees — manager + HR manage (including delete), trainer reads
                .requestMatchers(HttpMethod.GET,    "/api/employees/**").hasAnyRole("MANAGER", "HR", "TRAINER")
                .requestMatchers(HttpMethod.POST,   "/api/employees/**").hasAnyRole("MANAGER", "HR")
                .requestMatchers(HttpMethod.PUT,    "/api/employees/**").hasAnyRole("MANAGER", "HR")
                .requestMatchers(HttpMethod.DELETE, "/api/employees/**").hasAnyRole("MANAGER", "HR")

                // Messages — all authenticated roles
                .requestMatchers("/api/messages/**").authenticated()

                // Users — manager manages all; HR can read trainers for sprint creation dropdown
                .requestMatchers(HttpMethod.GET,    "/api/users/**").hasAnyRole("MANAGER", "HR")
                .requestMatchers(HttpMethod.POST,   "/api/users/**").hasRole("MANAGER")
                .requestMatchers(HttpMethod.PUT,    "/api/users/**").hasRole("MANAGER")
                .requestMatchers(HttpMethod.PATCH,  "/api/users/**").hasRole("MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasRole("MANAGER")

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:5174,http://localhost:3000}")
    private String allowedOriginsRaw;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = Arrays.asList(allowedOriginsRaw.split(","));
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
