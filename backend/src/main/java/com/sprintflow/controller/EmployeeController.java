package com.sprintflow.controller;

import com.sprintflow.dto.ApiResponseDTO;
import com.sprintflow.dto.EmployeeDTO;
import com.sprintflow.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
@Tag(name = "Employees", description = "Employee CRUD and sprint enrollment. Manager+HR manage, all roles read.")
public class EmployeeController {

    @Autowired private EmployeeService employeeService;

    @Operation(
        summary     = "List employees",
        description = "Returns active employees by default. Pass `status=Inactive` to include soft-deleted. Filter by `technology` and/or `cohort`."
    )
    @GetMapping
    public ResponseEntity<ApiResponseDTO<List<EmployeeDTO>>> getAll(
            @Parameter(description = "Filter by technology", example = "Java")
            @RequestParam(required = false) String technology,
            @Parameter(description = "Filter by cohort", example = "Java cohort 1")
            @RequestParam(required = false) String cohort,
            @Parameter(description = "Filter by status — omit for Active only", example = "Active")
            @RequestParam(required = false) String status) {
        List<EmployeeDTO> list;
        if (technology != null && cohort != null) {
            list = employeeService.getByTechnologyAndCohort(technology, cohort);
        } else if ("Inactive".equalsIgnoreCase(status)) {
            list = employeeService.getAllEmployees(); // includes all statuses
        } else {
            list = employeeService.getActiveEmployees(); // default: Active only
        }
        return ok("Employees retrieved successfully", list);
    }

    @Operation(
        summary     = "Search employees",
        description = "Full-text search by name or empId. Optionally filter by technology."
    )
    @GetMapping("/search")
    public ResponseEntity<ApiResponseDTO<List<EmployeeDTO>>> search(
            @Parameter(description = "Search keyword", example = "Ravi")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "Filter by technology", example = "Python")
            @RequestParam(required = false) String technology) {
        return ok("Search results", employeeService.search(keyword, technology));
    }

    @Operation(summary = "Get employee by ID")
    @ApiResponse(responseCode = "404", description = "Employee not found")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponseDTO<EmployeeDTO>> getById(
            @Parameter(description = "Employee DB ID", example = "1") @PathVariable Long id) {
        return ok("Employee retrieved successfully", employeeService.getById(id));
    }

    @Operation(
        summary     = "Create employee",
        description = "Manager or HR only.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = @ExampleObject(value = """
                    {
                      "empId": "EMP042",
                      "name": "Priya Sharma",
                      "email": "priya.sharma@ajacs.in",
                      "phone": "9876543210",
                      "technology": "Java",
                      "cohort": "Java cohort 2",
                      "department": "Training",
                      "status": "Active"
                    }
                    """))
        )
    )
    @ApiResponse(responseCode = "201", description = "Employee created")
    @PostMapping
    public ResponseEntity<ApiResponseDTO<EmployeeDTO>> create(@RequestBody EmployeeDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
            ApiResponseDTO.<EmployeeDTO>builder()
                .success(true).message("Employee created successfully")
                .data(employeeService.create(dto)).statusCode(201).build());
    }

    @Operation(summary = "Update employee", description = "Manager or HR only.")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponseDTO<EmployeeDTO>> update(
            @PathVariable Long id, @RequestBody EmployeeDTO dto) {
        return ok("Employee updated successfully", employeeService.update(id, dto));
    }

    @Operation(summary = "Delete employee", description = "**MANAGER only.**")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponseDTO<String>> delete(@PathVariable Long id) {
        employeeService.delete(id);
        return ok("Employee deleted successfully", null);
    }

    @Operation(summary = "Get employees enrolled in a sprint")
    @GetMapping("/sprint/{sprintId}")
    public ResponseEntity<ApiResponseDTO<List<EmployeeDTO>>> getSprintEmployees(
            @Parameter(description = "Sprint ID", example = "1") @PathVariable Long sprintId) {
        return ok("Sprint employees retrieved successfully", employeeService.getSprintEmployees(sprintId));
    }

    @Operation(
        summary     = "Enroll employee in sprint",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = @ExampleObject(value = "{ \"employeeId\": 5 }"))
        )
    )
    @PostMapping("/sprint/{sprintId}/enroll")
    public ResponseEntity<ApiResponseDTO<String>> enroll(
            @PathVariable Long sprintId, @RequestBody Map<String, Long> body) {
        employeeService.enrollEmployee(sprintId, body.get("employeeId"));
        return ok("Employee enrolled successfully", null);
    }

    @Operation(summary = "Remove employee from sprint")
    @DeleteMapping("/sprint/{sprintId}/remove/{employeeId}")
    public ResponseEntity<ApiResponseDTO<String>> remove(
            @PathVariable Long sprintId, @PathVariable Long employeeId) {
        employeeService.removeEmployee(sprintId, employeeId);
        return ok("Employee removed from sprint", null);
    }

    @Operation(
        summary     = "Auto-enroll employees by cohort pairs",
        description = "Automatically enrolls all employees whose technology+cohort matches the sprint's cohort pairs."
    )
    @PostMapping("/sprint/{sprintId}/auto-enroll")
    public ResponseEntity<ApiResponseDTO<String>> autoEnroll(
            @Parameter(description = "Sprint ID", example = "1") @PathVariable Long sprintId) {
        employeeService.autoEnrollByCohorts(sprintId);
        return ok("Employees auto-enrolled by cohort pairs", null);
    }

    private <T> ResponseEntity<ApiResponseDTO<T>> ok(String message, T data) {
        return ResponseEntity.ok(ApiResponseDTO.<T>builder()
                .success(true).message(message).data(data).statusCode(200).build());
    }
}
