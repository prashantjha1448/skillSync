import React from "react";

const Logo = ({ darkMode = true }) => {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/skillsync-logo.svg"
        alt="SkillSync"
        className="w-12 h-12"
      />

      <div>
        <h1
          className={`text-2xl font-bold ${
            darkMode
              ? "text-white"
              : "text-slate-900"
          }`}
        >
          SkillSync
        </h1>

        <p
          className={`text-xs tracking-[0.2em] uppercase ${
            darkMode
              ? "text-slate-400"
              : "text-slate-500"
          }`}
        >
          Connecting Talent With Opportunity
        </p>
      </div>
    </div>
  );
};

export default Logo;