import React, { useState, useEffect } from "react";
import { Button, Form } from "react-bootstrap";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const StatisticsOverlay = ({ iapId, open, onClose }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState("name_asc");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!open || !iapId) return;

    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);

        const iapRes = await fetch(`${API_BASE_URL}/deployed-iaps/${iapId}`);
        if (!iapRes.ok) throw new Error("Failed to fetch IAP details");
        const iapData = await iapRes.json();

        const activitiesRes = await fetch(
          `${API_BASE_URL}/deployed-iaps/${iapId}/activities`
        );
        if (!activitiesRes.ok) throw new Error("Failed to fetch activities");
        const activitiesData = await activitiesRes.json();

        const statsRes = await fetch(
          `${API_BASE_URL}/deployed-iaps/${iapId}/statistics`
        );
        if (!statsRes.ok) throw new Error("Failed to fetch statistics");
        const statsData = await statsRes.json();

        setStatistics({
          iap: iapData,
          activities: activitiesData,
          userScores: statsData,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [iapId, open]);

  const getSortedAndFilteredScores = () => {
    if (!statistics) return [];

    let scores = [...statistics.userScores];

    // Filter by name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      scores = scores.filter((user) =>
        user.user_name.toLowerCase().includes(query)
      );
    }

    // Sort
    scores.sort((a, b) => {
      if (sortOption === "name_asc") {
        return a.user_name.localeCompare(b.user_name);
      } else if (sortOption === "average_asc") {
        return parseFloat(a.average) - parseFloat(b.average);
      } else if (sortOption === "average_desc") {
        return parseFloat(b.average) - parseFloat(a.average);
      }
      return 0;
    });

    return scores;
  };

  const filteredAndSortedScores = getSortedAndFilteredScores();

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          width: "80%",
          maxWidth: "1000px",
          maxHeight: "80vh",
          overflow: "auto",
          position: "relative",
        }}
      >
        {/* Close Button */}
        <div style={{ textAlign: "right", marginBottom: "10px" }}>
          <Button
            variant="secondary"
            onClick={onClose}
            style={{ padding: "5px 10px", fontWeight: "bold" }}
          >
            X
          </Button>
        </div>

        {/* Title */}
        <h3 style={{ marginBottom: "20px" }}>
          <strong>{statistics?.iap?.name || "IAP Statistics"}</strong>
        </h3>

        {/* Filter and Sort Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "15px",
            gap: "10px",
          }}
        >
          <input
            type="text"
            placeholder="Search by user name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: "6px 10px", borderRadius: "5px" }}
          />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "5px" }}
          >
            <option value="name_asc">Name (A–Z)</option>
            <option value="average_asc">Average (Low → High)</option>
            <option value="average_desc">Average (High → Low)</option>
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", margin: "20px 0" }}>
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
            Error: {error}
          </div>
        )}

        {/* Table */}
        {statistics && !loading && (
          <div className="table-responsive">
            <table
              className="table table-bordered"
              style={{ borderCollapse: "collapse", width: "100%" }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      backgroundColor: "#eaeaea",
                      fontWeight: "bold",
                      color: "#000",
                      border: "1px solid #dee2e6",
                    }}
                  >
                    User
                  </th>
                  {statistics.activities.map((activity) => (
                    <th
                      key={activity.activity_id}
                      style={{
                        backgroundColor: "#eaeaea",
                        fontWeight: "bold",
                        color: "#000",
                        border: "1px solid #dee2e6",
                      }}
                    >
                      {activity.act_name}
                    </th>
                  ))}
                  <th
                    style={{
                      backgroundColor: "#eaeaea",
                      fontWeight: "bold",
                      color: "#000",
                      border: "1px solid #dee2e6",
                    }}
                  >
                    Average
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedScores.map((userScore, index) => (
                  <tr
                    key={userScore.user_id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9f9f9",
                    }}
                  >
                    <td style={{ border: "1px solid #dee2e6" }}>
                      {userScore.user_name}
                    </td>
                    {statistics.activities.map((activity) => (
                      <td
                        key={`${userScore.user_id}-${activity.activity_id}`}
                        style={{ border: "1px solid #dee2e6" }}
                      >
                        {userScore.scores[activity.activity_id] || 0}%
                      </td>
                    ))}
                    <td
                      style={{
                        fontWeight: "bold",
                        border: "1px solid #dee2e6",
                      }}
                    >
                      {parseFloat(userScore.average).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsOverlay;
