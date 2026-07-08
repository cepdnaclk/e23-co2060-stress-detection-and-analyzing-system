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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
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
