// src/services/userService.js
import api from "./api";

const userService = {
  // Active only — for sprint creation dropdown and HR lists
  getTrainers() {
    return api.get("/users", { params: { role: "TRAINER" } });
  },

  // All including Inactive — for manager Trainers page (show/restore)
  getAllTrainers() {
    return api.get("/users", { params: { role: "TRAINER", includeInactive: true } });
  },

  // Active only — for dropdowns
  getHRBPs() {
    return api.get("/users", { params: { role: "HR" } });
  },

  // All including Inactive — for manager HRBPs page (show/restore)
  getAllHRBPs() {
    return api.get("/users", { params: { role: "HR", includeInactive: true } });
  },

  getById(id) {
    return api.get(`/users/${id}`);
  },

  // Body: { name, email, role, phone, department, trainerRole, joinedDate }
  // Backend auto-generates a random password and emails credentials
  create(data) {
    return api.post("/users", data);
  },

  update(id, data) {
    return api.put(`/users/${id}`, data);
  },

  delete(id) {
    return api.delete(`/users/${id}`);
  },

  resendCredentials(id) {
    return api.post(`/users/${id}/resend-credentials`);
  },

  restore(id) {
    return api.patch(`/users/${id}/restore`);
  },
};

export default userService;
