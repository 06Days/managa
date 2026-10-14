'use client';

import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
interface AppInfo {
  name: string;
  version: string;
  relativePath: string;
}
const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:4000`
  : 'http://localhost:4000');

export default function AppsDashboard() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    
    fetch((API_URL+'/appmanager'))
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch applications');
        }
        return res.json();
      })
      .then((data) => {
        setApps(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          Error loading applications: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="mb-4 text-center">Discovered Applications</h1>
      
      {apps.length === 0 ? (
        <div className="alert alert-info text-center" role="alert">
          No applications yet
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {apps.map((app, index) => (
            <div className="col" key={index}>
                <a href={`/${app.name}`}>
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title text-capitalize mb-0 text-truncate" title={app.name}>
                      {app.name}
                    </h5>
                    <span className="badge bg-secondary">v{app.version}</span>
                  </div>
                  
                  <p className="card-text text-muted small mb-4">
                    <code>{app.relativePath}</code>
                  </p>
                  
                  <div className="mt-auto">
                    <button 
                      className="btn btn-outline-primary btn-sm w-100"
                      onClick={() => alert(`Navigating to or inspecting: ${app.name}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}