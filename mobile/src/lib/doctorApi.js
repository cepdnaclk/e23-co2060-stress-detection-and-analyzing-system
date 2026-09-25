import { API_URL } from "../../constants/api";

async function request(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `Request failed (Status ${response.status})`;
    try {
      const data = await response.json();
      errorMessage = data.message || errorMessage;
    } catch (_) {
      // Response is not JSON
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

export const doctorApi = {
  login: (email, password) => request("/doctor-auth/login", { method: "POST", body: { email, password } }),
  getPublicDoctors: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        query.set(key, value);
      }
    });

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/doctors${suffix}`);
  },
  getDoctorProfile: (doctorId) => request(`/doctors/${doctorId}`),
  requestConsultation: (doctorId, reason, token, stressLevel) =>
    request(`/doctors/${doctorId}/requests`, {
      method: "POST",
      token,
      body: { reason, stressLevel },
    }),
  getMyRequests: (token) => request("/doctors/my-requests", { token }),
  getDoctorDashboard: (token) => request("/doctors/dashboard", { token }),
  getDoctorNotifications: (token) => request("/doctors/notifications", { token }),
  getPendingRequests: (token) => request("/doctors/pending-requests", { token }),
  getCurrentPatients: (token) => request("/doctors/current-patients", { token }),
  getPatientDetails: (patientId, token) => request(`/doctors/patients/${patientId}`, { token }),
  getCompletedConsultations: (token) => request("/doctors/completed-consultations", { token }),
  getDoctorReviews: (token) => request("/doctors/reviews", { token }),
  acceptRequest: (requestId, token) =>
    request(`/doctors/requests/${requestId}/accept`, { method: "POST", token }),
  rejectRequest: (requestId, token) =>
    request(`/doctors/requests/${requestId}/reject`, { method: "POST", token }),
  completeConsultation: (assignmentId, token) =>
    request(`/doctors/assignments/${assignmentId}/complete`, { method: "POST", token }),
  addConsultationNote: (requestId, token, note) =>
    request(`/doctors/requests/${requestId}/notes`, {
      method: "POST",
      token,
      body: { note },
    }),
  rateDoctor: (assignmentId, token, stars, review) =>
    request(`/doctors/assignments/${assignmentId}/rating`, {
      method: "POST",
      token,
      body: { stars, review },
    }),
  updateDoctorProfile: (token, payload) =>
    request("/doctors/profile", { method: "PUT", token, body: payload }),
  updateAvailability: (token, availability) =>
    request("/doctors/availability", { method: "PATCH", token, body: { availability } }),
  getDoctorAvailability: (doctorId) => request(`/doctors/${doctorId}/availability`),
  getAvailableSlots: (doctorId, date) => request(`/doctors/${doctorId}/available-slots?date=${date}`),
  createAppointment: (token, payload) => request("/doctors/appointments", { method: "POST", token, body: payload }),
  getAppointments: (token, status = "") => request(`/doctors/appointments${status ? `?status=${status}` : ""}`, { token }),
  getUserAppointments: (token) => request("/doctors/appointments/me", { token }),
  acceptAppointment: (appointmentId, token) => request(`/doctors/appointments/${appointmentId}/accept`, { method: "POST", token }),
  rejectAppointment: (appointmentId, reason, token) => request(`/doctors/appointments/${appointmentId}/reject`, { method: "POST", token, body: { reason } }),
  createDoctorAvailability: (token, payload) => request("/doctors/availability", { method: "POST", token, body: payload }),
  updateDoctorAvailability: (token, availabilityId, payload) => request(`/doctors/availability/${availabilityId}`, { method: "PUT", token, body: payload }),
  deleteDoctorAvailability: (token, availabilityId) => request(`/doctors/availability/${availabilityId}`, { method: "DELETE", token }),
  getDoctorStatistics: (doctorId, token) => request(`/admin/doctors/${doctorId}/statistics`, { token }),
  getDoctorAdminReviews: (doctorId, token) => request(`/admin/doctors/${doctorId}/reviews`, { token }),
  getAdminDoctors: (token, params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        query.set(key, value);
      }
    });

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/admin/doctors${suffix}`, { token });
  },
  createDoctor: (token, payload) => request("/admin/doctors", { method: "POST", token, body: payload }),
  updateDoctor: (token, doctorId, payload) =>
    request(`/admin/doctors/${doctorId}`, { method: "PUT", token, body: payload }),
  activateDoctor: (token, doctorId) =>
    request(`/admin/doctors/${doctorId}/activate`, { method: "PATCH", token }),
  deactivateDoctor: (token, doctorId) =>
    request(`/admin/doctors/${doctorId}/deactivate`, { method: "PATCH", token }),
  deleteDoctor: (token, doctorId) =>
    request(`/admin/doctors/${doctorId}`, { method: "DELETE", token }),
};
