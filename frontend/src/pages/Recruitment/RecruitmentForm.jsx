import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavbarComponent from "../../components/LandingPage/Navbar/NavbarComponent";
import Footer from "../../components/Footer/Footer";
import "./RecruitmentForm.css";
import axiosInstance from "../../axios";

const RecruitmentForm = () => {
  const navigate = useNavigate();
  const alertRef = useRef(null);

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [progress, setProgress] = useState(0);

  const [sessionId, setSessionId] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // alert message (string or array of strings)
  const [apiAlert, setApiAlert] = useState(null);

  // registration number error (inline)
  const [regError, setRegError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    regNumber: "",
    semester: "",
    program: "",
    skills: "",
    coursework: "",
    preferredRole: "",
    secondaryRole: "",
    whyJoin: "",
    experience: "",
    availability: "",
    linkedin: "",
  });

  // -------------------------
  // Helpers
  // -------------------------
  // Example required: SP23-BSE-090 (also allow FA23-..., and program codes 2-5 letters)
  const regNoRegex = /^(SP|FA)\d{2}-[A-Z]{2,5}-\d{3}$/;

  const setAlertAndScroll = (msg) => {
    setApiAlert(msg);
    // scroll to alert
    setTimeout(() => {
      alertRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  // Flatten nested DRF error objects into readable lines
  const flattenErrors = (errObj, prefix = "") => {
    const lines = [];

    if (!errObj) return lines;

    // if string
    if (typeof errObj === "string") {
      lines.push(prefix ? `${prefix}: ${errObj}` : errObj);
      return lines;
    }

    // if array
    if (Array.isArray(errObj)) {
      errObj.forEach((item) => {
        if (typeof item === "string") {
          lines.push(prefix ? `${prefix}: ${item}` : item);
        } else {
          lines.push(...flattenErrors(item, prefix));
        }
      });
      return lines;
    }

    // if object
    if (typeof errObj === "object") {
      Object.entries(errObj).forEach(([key, value]) => {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        lines.push(...flattenErrors(value, newPrefix));
      });
      return lines;
    }

    // fallback
    lines.push(prefix ? `${prefix}: ${String(errObj)}` : String(errObj));
    return lines;
  };

  const formatKey = (path) => {
    // personal_info.phone_number -> Phone Number
    const last = path.split(".").pop() || path;
    const map = {
      first_name: "First Name",
      last_name: "Last Name",
      phone_number: "Phone Number",
      reg_no: "Registration Number",
      current_semester: "Current Semester",
      preferred_role: "Preferred Role",
      secondary_role: "Secondary Role",
      join_purpose: "Join Purpose",
      relevant_coursework: "Coursework",
    };
    return map[last] || last.replaceAll("_", " ");
  };

  const normalizeFlattenedErrors = (lines) => {
    // Convert "personal_info.phone_number: msg" -> "Phone Number: msg"
    return lines.map((line) => {
      const parts = line.split(":");
      if (parts.length < 2) return line;
      const key = parts.shift().trim();
      const msg = parts.join(":").trim();
      return `${formatKey(key)}: ${msg}`;
    });
  };

  // -------------------------
  // Fetch active session
  // -------------------------
  useEffect(() => {
    const fetchActiveSession = async () => {
      setSessionLoading(true);
      setApiAlert(null);

      try {
        const res = await axiosInstance.get("/recruitment/active-session/");
        const active = Array.isArray(res.data) ? res.data[0] : res.data;

        if (!active?.id) {
          setSessionId(null);
          setAlertAndScroll("No active recruitment session found.");
        } else {
          setSessionId(active.id);
        }
      } catch (err) {
        const data = err.response?.data;
        const message =
          data?.detail ||
          data?.message ||
          (typeof data === "string" ? data : null) ||
          "Failed to load active recruitment session.";
        setSessionId(null);
        setAlertAndScroll(message);
      } finally {
        setSessionLoading(false);
      }
    };

    fetchActiveSession();
  }, []);

  // -------------------------
  // Handle form changes
  // -------------------------
  const handleChange = (e) => {
    if (apiAlert) setApiAlert(null);

    const { name, value } = e.target;

    // ✅ Registration format validation + auto uppercase
    if (name === "regNumber") {
  const cleaned = value.toUpperCase().replace(/\s+/g, "");
  setFormData((prev) => ({ ...prev, regNumber: cleaned }));

  if (cleaned && !regNoRegex.test(cleaned)) {
    setRegError("Format must be SP or FA like: SP23-BSE-090");
  } else {
    setRegError("");
  }
  return;
}


    // Prevent same preferred & secondary role
    if (name === "preferredRole" && value === formData.secondaryRole) {
      setFormData((prev) => ({
        ...prev,
        preferredRole: value,
        secondaryRole: "",
      }));
      return;
    }

    if (name === "secondaryRole" && value === formData.preferredRole) {
      setAlertAndScroll("Secondary role must be different from preferred role");
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // -------------------------
  // Progress calculation
  // -------------------------
  useEffect(() => {
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phoneNumber",
      "regNumber",
      "semester",
      "program",
      "skills",
      "preferredRole",
      "whyJoin",
      "availability",
    ];

    const filledFields = requiredFields.filter(
      (field) => String(formData[field]).trim() !== ""
    ).length;

    setProgress((filledFields / requiredFields.length) * 100);
  }, [formData]);

  // -------------------------
  // Submit application
  // -------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConfirmed) {
      setAlertAndScroll("Please confirm the information before submitting.");
      return;
    }

    if (!sessionId) {
      setAlertAndScroll("No active recruitment session found. Please try again later.");
      return;
    }

    // ✅ reg validation before submit
    if (!regNoRegex.test(formData.regNumber)) {
      setRegError("Format must be like SP23-BSE-090");
      setAlertAndScroll("Please fix Registration Number format before submitting.");
      return;
    }

    if (formData.secondaryRole && formData.secondaryRole === formData.preferredRole) {
      setAlertAndScroll("Secondary role must be different from preferred role");
      return;
    }

    setSubmitting(true);
    setApiAlert(null);

    const skillsArray = formData.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const courseworkArray = formData.coursework
      ? formData.coursework.split(",").map((c) => c.trim()).filter(Boolean)
      : [];

    const payload = {
      recruitment_session: sessionId,
      personal_info: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
      },
      academic_info: {
        program: formData.program,
        current_semester: Number(formData.semester),
        skills: skillsArray,
        relevant_coursework: courseworkArray,
        reg_no: formData.regNumber,
      },
      role_preferences: {
        preferred_role: formData.preferredRole,
        secondary_role: formData.secondaryRole || null,
        join_purpose: formData.whyJoin,
      },
    };

    try {
      await axiosInstance.post("/recruitment/submit-application/", payload);
      navigate("/recruitment/submitted");
    } catch (err) {
      const data = err.response?.data;

      // ✅ Convert nested errors to readable list
      if (data && typeof data === "object") {
        const flat = flattenErrors(data);
        const pretty = normalizeFlattenedErrors(flat);
        setAlertAndScroll(pretty.length ? pretty : "Submission failed");
      } else {
        setAlertAndScroll(err.message || "Submission failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="recruitment-page">
      <NavbarComponent />

      <div className="box-header">
        <div className="form-header">
          <h1>RECRUITMENT APPLICATION</h1>
          <p>Fill out the application form to join the ACM team</p>

          {sessionLoading && (
            <p style={{ marginTop: 8, fontSize: 14 }}>Loading active session...</p>
          )}
        </div>
      </div>

      {/* ✅ Alert Box */}
      <div ref={alertRef}>
        {apiAlert && (
          <div
            style={{
              margin: "14px auto 0",
              maxWidth: 900,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(220, 38, 38, 0.35)",
              background: "rgba(220, 38, 38, 0.10)",
              color: "#b91c1c",
            }}
          >
            {Array.isArray(apiAlert) ? (
              <>
                <b style={{ display: "block", marginBottom: 6 }}>Please fix these errors:</b>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {apiAlert.map((m, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{m}</li>
                  ))}
                </ul>
              </>
            ) : (
              <b>{apiAlert}</b>
            )}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="progress-container">
        <div className="progress-tabs">
          <div className="tab"><span>Personal Info</span></div>
          <div className="tab"><span>Education</span></div>
          <div className="tab"><span>Preferences</span></div>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form className="recruitment-form-container" onSubmit={handleSubmit}>
        {/* SECTION 1 */}
        <div className="form-card">
          <h3>Personal Information</h3>

          <div className="input-row">
            <div className="input-group">
              <label>First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+92XXXXXXXXXX"
              required
            />
          </div>
        </div>

        {/* SECTION 2 */}
        <div className="form-card">
          <h3>Academic Information</h3>

          <div className="input-row">
            <div className="input-group">
              <label>Registration Number *</label>
              <input
                type="text"
                name="regNumber"
                value={formData.regNumber}
                onChange={handleChange}
                placeholder="SP23-BSE-090"
                required
                style={{ borderColor: regError ? "crimson" : undefined }}
              />
              {regError && (
                <small style={{ color: "crimson", marginTop: 6, display: "block" }}>
                  {regError}
                </small>
              )}
            </div>

            <div className="input-group">
              <label>Current Semester *</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Program *</label>
            <select
              name="program"
              value={formData.program}
              onChange={handleChange}
              required
            >
              <option value="">Select your program</option>
              <option value="BSSE">Bachelor of Software Engineering</option>
              <option value="BSCS">Bachelor of Computer Science</option>
              <option value="BSAI">Bachelor of Artificial Intelligence</option>
            </select>
          </div>

          <div className="input-group">
            <label>Skills * (comma separated)</label>
            <textarea
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              rows="4"
              required
            />
          </div>

          <div className="input-group">
            <label>Relevant Coursework (comma separated)</label>
            <textarea
              name="coursework"
              value={formData.coursework}
              onChange={handleChange}
              rows="4"
            />
          </div>
        </div>

        {/* SECTION 3 */}
        <div className="form-card">
          <h3>Role Preferences</h3>

          <div className="input-row">
            <div className="input-group">
              <label>Preferred Role *</label>
              <select
                name="preferredRole"
                value={formData.preferredRole}
                onChange={handleChange}
                required
              >
                <option value="">Select role</option>
                <option value="CODEHUB">CodeHub (Development)</option>
                <option value="GRAPHICS">Graphics / UI Design</option>
                <option value="SOCIAL_MEDIA_MARKETING">Social Media Marketing</option>
                <option value="MEDIA">Media & Coverage</option>
                <option value="DECOR">Decor Team</option>
                <option value="EVENTS_LOGISTICS">Events & Logistics</option>
              </select>
            </div>

            <div className="input-group">
              <label>Secondary Role</label>
              <select
                name="secondaryRole"
                value={formData.secondaryRole}
                onChange={handleChange}
              >
                <option value="">Select role</option>
                <option value="CODEHUB">CodeHub (Development)</option>
                <option value="GRAPHICS">Graphics / UI Design</option>
                <option value="SOCIAL_MEDIA_MARKETING">Social Media Marketing</option>
                <option value="MEDIA">Media & Coverage</option>
                <option value="DECOR">Decor Team</option>
                <option value="EVENTS_LOGISTICS">Events & Logistics</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Why do you want to join ACM? *</label>
            <textarea
              name="whyJoin"
              value={formData.whyJoin}
              onChange={handleChange}
              rows="4"
              required
            />
          </div>

          <div className="input-group">
            <label>Previous Experience</label>
            <textarea
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              rows="4"
            />
          </div>

          <div className="input-group">
            <label>Weekly Availability *</label>
            <textarea
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              rows="3"
              required
            />
          </div>

          <div className="input-group">
            <label>LinkedIn Profile</label>
            <input
              type="url"
              name="linkedin"
              value={formData.linkedin}
              onChange={handleChange}
            />
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="confirm"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
            />
            <label htmlFor="confirm">
              I confirm that all information provided is accurate
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={submitting || sessionLoading || !sessionId || !!regError}
        >
          {submitting ? "Submitting..." : "Submit Application"}
        </button>
      </form>

      <Footer />
    </div>
  );
};

export default RecruitmentForm;
