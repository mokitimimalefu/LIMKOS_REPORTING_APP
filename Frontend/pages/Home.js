import React from "react";

export default function Home({ onNavigate }) {
  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: "#fff", color: "#333" }}>
      
      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "5px 20px",
          backgroundColor: "#f5f5f5",
          fontSize: "12px",
        }}
      >
    
        
      </div>

      {/* Main Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "15px 20px",
          backgroundColor: "#fff",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        {/* Logo */}
        <div>
          <img src="/images/logo.png" alt="Edura Logo" style={{ height: "50px" }} />
        </div>

        {/* Navigation Links */}
        <ul
          style={{
            listStyle: "none",
            display: "flex",
            gap: "20px",
            margin: 0,
          }}
        >
          <li><button onClick={() => onNavigate("home")} style={{ background: "none", border: "none", cursor: "pointer", color: "#333" }}>Home</button></li>
          <li><button onClick={() => onNavigate("courses")} style={{ background: "none", border: "none", cursor: "pointer", color: "#333" }}>Courses</button></li>
          <li><button onClick={() => onNavigate("teachers")} style={{ background: "none", border: "none", cursor: "pointer", color: "#333" }}>Teachers</button></li>
          <li><button onClick={() => onNavigate("pages")} style={{ background: "none", border: "none", cursor: "pointer", color: "#333" }}>Pages</button></li>
          <li><button onClick={() => onNavigate("blog")} style={{ background: "none", border: "none", cursor: "pointer", color: "#333" }}>Blog</button></li>
          <li><button onClick={() => onNavigate("contact")} style={{ background: "none", border: "none", cursor: "pointer", color: "#333" }}>Contact</button></li>
        </ul>

        {/* Auth Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => onNavigate("login")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#fff",
              color: "#333",
              border: "1px solid #333",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Login
          </button>
          <button
            onClick={() => onNavigate("register")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#0066ff",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Register
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "120px 20px",
          flexWrap: "wrap",
          backgroundImage: "url('/images/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          color: "#fff",
        }}
      >
        {/* Optional Overlay for readability */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.4)",
          zIndex: 1,
        }}></div>

        {/* Text Content */}
        <div style={{ flex: 1, minWidth: "300px", zIndex: 2 }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "16px" }}>
            Limkokwing University
          </h1>
          <p style={{ fontSize: "1.2rem", marginBottom: "16px" }}>
            Is a School of Creative Technology.
          </p>

          {/* Vertical List under text */}
          <ul style={{ listStyle: "none", padding: 0, lineHeight: "2", fontSize: "1.1rem", marginTop: "10px", display: "flex" }}>
            <li>✅ Get Certified</li>
            <li>✅ Gain Job-ready Skills</li>
            <li>✅ Great Life</li>
          </ul>

          {/* Buttons under the list */}
          <div style={{ marginTop: "20px", display: "flex", gap: "15px", flexWrap: "wrap" }}>
            <button
              onClick={() => onNavigate("login")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#fff",
                color: "#333",
                border: "1px solid #333",
                borderRadius: "5px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontWeight: "bold",
              }}
            >
              Login <span style={{ fontSize: "0.8rem" }}>➔</span>
            </button>
            <button
              onClick={() => onNavigate("register")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#0066ff", // light blue
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontWeight: "bold",
              }}
            >
              Register <span style={{ fontSize: "0.8rem" }}>➔</span>
            </button>
          </div>
        </div>

        {/* Floating Student Image with transparent background */}
        <div style={{ flex: 1, minWidth: "300px", zIndex: 2, textAlign: "center" }}>
          <img
            src="/images/hero-student.jpg"
            alt="Student"
            style={{
              maxWidth: "80%",
              height: "auto",
              borderRadius: "8px",
              boxShadow: "0 15px 40px rgba(0,0,0,0.5)",
              transform: "translateY(-20px)"
            }}
          />
        </div>
      </section>

      {/* White Navigation Bar */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px 0",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: "#0066ff",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "12px",
            }}
          >
            📚
          </div>
          <span>20k+ Courses</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: "#0066ff",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "12px",
            }}
          >
            ♾️
          </div>
          <span>Lifetime Access</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: "#0066ff",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "12px",
            }}
          >
            💰
          </div>
          <span>Value For Money Lifetime Support</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: "#0066ff",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "12px",
            }}
          >
            👥
          </div>
          <span>Community Support</span>
        </div>
      </div>

      {/* About Section */}
      <section
        style={{
          backgroundColor: "#fff",
          padding: "60px 20px",
          display: "flex",
          alignItems: "flex-start",
          gap: "40px",
        }}
      >
        <div style={{ flex: 1, position: "relative", marginTop: "40px" }}>
          <img
            src="/images/about-students.jpg"
            alt="About Students"
            style={{
              width: "90%",
              height: "auto",
              borderRadius: "8px",
            }}
          />
          <img
            src="/images/inside-student.jpg"
            alt="Inside Student"
            style={{
              position: "absolute",
              bottom: "-40px",
              right: "-10px",
              width: "120px",
              height: "140px",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
              backgroundColor: "#fff",
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <h3
            style={{
              textTransform: "uppercase",
              fontSize: "2rem",
              fontWeight: "bold",
              marginBottom: "20px",
            }}
          >
            Dive into our courses and ignite your learning
          </h3>

          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: "1.6",
              marginBottom: "30px",
            }}
          >
            Whether you're just starting out or looking to advance your skills, our carefully designed programs provide engaging, hands-on experiences that inspire curiosity and growth. Learn at your own pace, gain practical knowledge, and unlock new opportunities to achieve your goals.
          </p>

          <div style={{ fontSize: "1rem", lineHeight: "1.5" }}>
            <p style={{ marginBottom: "10px" }}>
              ✅ Explore our courses to grow your skills and ignite your passion for learning
            </p>
            <p style={{ marginBottom: "10px" }}>
              ✅ Hands-on lessons and expert guidance help you succeed and grow
            </p>
            <p>
              ✅ Our courses empower you to learn, practice, and achieve more every day
            </p>
          </div>
        </div>
      </section>

      {/* Courses Navigation Bar */}
      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "40px 20px",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            textAlign: "center",
            width: "200px",
            height: "250px",
            margin: "10px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <img
            src="/images/course1.jpg"
            alt="Course 1"
            style={{
              width: "100%",
              height: "150px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
          <p style={{ marginTop: "10px", fontWeight: "bold" }}>Course 1</p>
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            textAlign: "center",
            width: "200px",
            height: "250px",
            margin: "10px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <img
            src="/images/course2.jpg"
            alt="Course 2"
            style={{
              width: "100%",
              height: "150px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
          <p style={{ marginTop: "10px", fontWeight: "bold" }}>Course 2</p>
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            textAlign: "center",
            width: "200px",
            height: "250px",
            margin: "10px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <img
            src="/images/course3.jpg"
            alt="Course 3"
            style={{
              width: "100%",
              height: "150px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
          <p style={{ marginTop: "10px", fontWeight: "bold" }}>Course 3</p>
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            textAlign: "center",
            width: "200px",
            height: "250px",
            margin: "10px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <img
            src="/images/course4.jpg"
            alt="Course 4"
            style={{
              width: "100%",
              height: "150px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
          <p style={{ marginTop: "10px", fontWeight: "bold" }}>Course 4</p>
        </div>
      </div>
    </div>
  );
}
