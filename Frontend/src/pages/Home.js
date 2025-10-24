import React from "react";

const Home = ({ onNavigate, selectedRole, setSelectedRole }) => {
  const handleGetStarted = () => {
    onNavigate("register");
  };

  const [showRoleText, setShowRoleText] = React.useState(false);

  const roleDetails = {
    student: {
      title: "Student",
      image: "/images/students.jpg",
      learnMoreImage: "/images/student_learnmore.jpg",
      description: "Attend classes and complete assignments.",
    },
    lecturer: {
      title: "Lecturer",
      image: "/images/lecturer.jpg",
      learnMoreImage: "/images/lecturer_learmore.jpg",
      description: "Conduct and prepare lessons. Evaluate student work."
    },
    principalLecturer: {
      title: "Principal Lecturer (PRL)",
      image: "/images/principal_lecturer.jpg",
      learnMoreImage: "/images/principaLecturer_learnmore.jpg",
      description: "Supervise lecturers & courses.Give feedback",
    },
    programLeader: {
      title: "Program Leader (PL)",
      image: "/images/program_leader.jpg",
      learnMoreImage: "/images/programLeader_learnmore.jpg",
      description: "Plan courses and assign lecturers. Oversee Principal Lecturers.",
    },
  };

  const handleLearnMore = (role) => {
    onNavigate("home", role);
    setShowRoleText(false);
  };

  const handleContinue = () => {
    setShowRoleText(true);
  };

  const handleCloseRoleText = () => {
    setSelectedRole(null);
    setShowRoleText(false);
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "linear-gradient(135deg, #000000 0%, #333333 50%, #000000 100%)" }}>
      {/* Hero Section */}
      <div
        style={{
          width: "100%",
          minHeight: "60vh",
          backgroundImage: "url('/images/graduated_students.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          textAlign: "center",
          color: "#fff",
          position: "relative",
        }}
      >
        <img
          src="/images/limkokwing_logo.webp"
          alt="Limkokwing Logo"
          style={{
            width: "180px",
            display: "block",
            margin: "0 auto",
            marginTop: "10px",
          }}
        />
        <h1 style={{ fontSize: "42px", textShadow: "2px 2px 10px #000" }}>
          WELCOME TO OUR UNIVERSITY
        </h1>
        <button
          style={{
            marginTop: "30px",
            padding: "16px 40px",
            fontSize: "22px",
            borderRadius: "10px",
            border: "none",
            background: "#000",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#333'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#000'}
          onClick={handleGetStarted}
        >
          Get Started
        </button>
      </div>

      {/* Roles Section */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            justifyContent: "center",
            alignItems: "stretch"
          }}
        >
          {Object.entries(roleDetails).map(([key, role]) => (
            <div
              key={key}
              style={{
                background: "#fff",
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                padding: "24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                height: "450px",
                justifyContent: "space-between",
                transition: "transform 0.3s ease",
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-5px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <div>
                <img
                  src={role.image}
                  alt={role.title}
                  style={{
                    width: "100%",
                    height: "220px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    marginBottom: "16px",
                  }}
                />
                <h3
                  style={{
                    fontSize: "20px",
                    marginBottom: "12px",
                    color: "#000",
                    fontWeight: "bold",
                  }}
                >
                  {role.title}
                </h3>
                <p style={{
                  fontSize: "14px",
                  color: "#444",
                  textAlign: "center",
                  marginBottom: "20px",
                  height: "60px",
                  overflow: "hidden"
                }}>
                  {role.description}
                </p>
              </div>
              
              <button
                style={{
                  padding: "12px 24px",
                  fontSize: "16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#000",
                  color: "#fff",
                  fontWeight: "bold",
                  cursor: "pointer",
                  width: "100%",
                  transition: "background-color 0.3s ease"
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#333'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#000'}
                onClick={() => handleLearnMore(key)}
              >
                Learn More
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Learn More Fullscreen */}
      {selectedRole && !showRoleText && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "#fff",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={roleDetails[selectedRole].learnMoreImage}
            alt={roleDetails[selectedRole].title + " Learn More"}
            style={{
              width: "100vw",
              height: "90vh",
              objectFit: "cover",
            }}
          />
          <button
            style={{
              marginTop: "10px",
              padding: "12px 24px",
              fontSize: "18px",
              borderRadius: "8px",
              border: "none",
              background: "#000",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#333'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#000'}
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      )}

      {/* Show all role descriptions on Continue */}
      {selectedRole && showRoleText && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "linear-gradient(135deg, #000000 0%, #333333 50%, #000000 100%)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflowY: "auto"
          }}
        >
          <div style={{
            maxWidth: 700,
            width: "90%",
            background: "#fff",
            borderRadius: "18px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            padding: "40px 32px",
            textAlign: "left"
          }}>
            <h2 style={{
              textAlign: "center",
              fontSize: "28px",
              fontWeight: "bold",
              marginBottom: "24px",
              color: "#000"
            }}>
              {roleDetails[selectedRole].title} Description
            </h2>
            <div style={{ marginBottom: "32px" }}>
              {selectedRole === "student" && (
                <p style={{ fontSize: "16px", color: "#333", marginBottom: 0, lineHeight: "1.6" }}>
                  As a student, your main focus is on learning and growing. Make sure to attend your classes, keep track of your progress, and actively engage in assignments. Use the monitoring tools available to see how you're doing, and don't hesitate to provide feedback or rate your courses—your input helps improve the learning experience for everyone.
                </p>
              )}
              {selectedRole === "lecturer" && (
                <p style={{ fontSize: "16px", color: "#333", marginBottom: 0, lineHeight: "1.6" }}>
                  As a lecturer, you are responsible for guiding your students through their courses. Conduct your classes with clarity, keep track of student performance, and generate reports to monitor progress. Your observations and ratings help maintain academic standards and support students in achieving their goals.
                </p>
              )}
              {selectedRole === "principalLecturer" && (
                <p style={{ fontSize: "16px", color: "#333", marginBottom: 0, lineHeight: "1.6" }}>
                  As a principal lecturer, you oversee the lecturers and courses in your stream. Review course content, monitor teaching quality, and provide constructive feedback to lecturers. Your role ensures that the courses under your supervision maintain high standards and that students receive consistent, quality education.
                </p>
              )}
              {selectedRole === "programLeader" && (
                <p style={{ fontSize: "16px", color: "#333", marginBottom: 0, lineHeight: "1.6" }}>
                  As a program leader, you are in charge of managing the entire program. Plan and assign course modules, oversee the performance of PRLs, and monitor the overall progress of courses and lectures. Your guidance ensures that the program runs smoothly, maintains academic excellence, and provides the best learning experience for both students and staff.
                </p>
              )}
            </div>
            <div style={{ textAlign: "center" }}>
              <button
                style={{
                  padding: "12px 44px",
                  fontSize: "18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#000",
                  color: "#fff",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#333'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#000'}
                onClick={handleCloseRoleText}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;