import React from "react";

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  let pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (page <= 4) {
      pages = [1, 2, 3, 4, 5, "...", totalPages];
    } else if (page >= totalPages - 3) {
      pages = [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      pages = [1, "...", page - 1, page, page + 1, "...", totalPages];
    }
  }
  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >{"<"}</button>
      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={idx} className="pagination-ellipsis">...</span>
        ) : (
          <button
            key={p}
            className={`pagination-btn${p === page ? " active" : ""}`}
            onClick={() => onPageChange(p)}
            disabled={p === page}
          >{p}</button>
        )
      )}
      <button
        className="pagination-btn"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >{">"}</button>
    </div>
  );
};

export default Pagination;