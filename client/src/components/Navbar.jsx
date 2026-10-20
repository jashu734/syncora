import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Layers, ShieldCheck, Ticket } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="brand-logo">
          <div className="brand-icon">
            <Layers size={18} />
          </div>
          <span>Syncora</span>
        </Link>

        <div className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Workshops
          </NavLink>
          <NavLink
            to="/my-bookings"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Ticket size={16} />
              My Bookings
            </span>
          </NavLink>
          <div className="badge badge-success" title="ACID Transactions & Conditional Atomic Decrement Active">
            <ShieldCheck size={14} />
            <span>Concurrency Safe</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
