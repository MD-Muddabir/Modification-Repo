import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SetupGuideModal.css';

const SetupGuideModal = ({ onClose }) => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);

    const steps = [
        {
            title: "1. Institute Settings (Root Level)",
            icon: "⚙️",
            description: "Begin by configuring your institute's fundamental details. Set your logo, name, address, and global preferences.",
            actionText: "Go to Settings",
            path: "/admin/settings",
            color: "#6366f1"
        },
        {
            title: "2. Create Classes",
            icon: "📚",
            description: "Define the structure of your institute by creating standard Classes or Standards (e.g., Class 10, Class 12 Science).",
            actionText: "Manage Classes",
            path: "/admin/classes",
            color: "#8b5cf6"
        },
        {
            title: "3. Define Subjects",
            icon: "📖",
            description: "Add subjects and assign them to the respective classes. This maps out exactly what curriculum each class follows.",
            actionText: "Manage Subjects",
            path: "/admin/subjects",
            color: "#ec4899"
        },
        {
            title: "4. Onboard Faculty",
            icon: "👩‍🏫",
            description: "Create profiles for your teaching staff. Once added, you can assign them to specific subjects and classes to build the academic structure.",
            actionText: "Manage Faculty",
            path: "/admin/faculty",
            color: "#f43f5e"
        },
        {
            title: "5. Configure Fee Structure",
            icon: "💰",
            description: "Before enrolling students, create transparent fee structures based on classes. Define tuition, library, or transport fees separately if needed.",
            actionText: "Manage Fees",
            path: "/admin/fees",
            color: "#f59e0b"
        },
        {
            title: "6. Enroll Students & Parents",
            icon: "👨‍🎓",
            description: "Now your foundation is ready! Add students, allocate them to classes, apply their fee structures, and link parent accounts for transparency.",
            actionText: "Manage Students",
            path: "/admin/students",
            color: "#10b981"
        },
        {
            title: "7. Daily Operations (Advanced)",
            icon: "📅",
            description: "With data mapped, begin daily operations like taking Attendance, creating Timetables, scheduling Exams, and uploading Notes or Assignments.",
            actionText: "View Dashboard",
            path: "/admin/dashboard",
            color: "#3b82f6"
        },
        {
            title: "8. Delegate via Managers",
            icon: "👨‍💼",
            description: "Create manager accounts with specific permissions to delegate tasks like attendance taking or fee collection without sharing sensitive info.",
            actionText: "Manager System",
            path: "/admin/admins",
            color: "#14b8a6"
        }
    ];

    const handleNavigate = (path) => {
        onClose();
        if (path !== "/admin/dashboard") {
            navigate(path);
        }
    };

    return (
        <div className="setup-guide-overlay">
            <div className="setup-guide-modal">
                <div className="setup-guide-header">
                    <div className="setup-guide-header-title">
                        <span className="setup-guide-icon">🗺️</span>
                        <h2>Institute Setup & Workflow Guide</h2>
                    </div>
                    <button className="setup-guide-close" onClick={onClose}>&times;</button>
                </div>
                
                <div className="setup-guide-body">
                    <p className="setup-guide-intro">
                        Welcome to your comprehensive setup guide. Follow these connected steps from root to child level to perfectly structure your educational platform.
                    </p>

                    <div className="setup-guide-timeline">
                        {steps.map((step, index) => (
                            <div 
                                key={index} 
                                className={`setup-guide-step ${activeStep === index ? 'active' : ''}`}
                                onClick={() => setActiveStep(index)}
                                style={{ "--step-color": step.color }}
                            >
                                <div className="step-connector">
                                    <div className="step-marker">{index + 1}</div>
                                    {index < steps.length - 1 && <div className="step-line"></div>}
                                </div>
                                <div className="step-content">
                                    <div className="step-header">
                                        <h3><span className="step-emoji">{step.icon}</span> {step.title}</h3>
                                        <button 
                                            className="step-action-btn"
                                            onClick={(e) => { e.stopPropagation(); handleNavigate(step.path); }}
                                        >
                                            {step.actionText} &rarr;
                                        </button>
                                    </div>
                                    <p className="step-desc">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="setup-guide-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Got it, thanks!</button>
                </div>
            </div>
        </div>
    );
};

export default SetupGuideModal;
