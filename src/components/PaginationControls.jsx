import { ChevronLeft, ChevronRight } from 'lucide-react';

const PaginationControls = ({
    currentPage,
    totalPages,
    pageSize,
    onPageChange,
    onPageSizeChange,
    totalItems
}) => {
    const pageSizes = [10, 25, 50];

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            borderTop: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.02)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>Rows per page:</span>
                <select
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        outline: 'none'
                    }}
                >
                    {pageSizes.map(size => (
                        <option key={size} value={size} style={{ background: '#1a1a1a' }}>{size}</option>
                    ))}
                </select>
                <span style={{ marginLeft: '12px' }}>
                    Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} - {Math.min(currentPage * pageSize, totalItems)} of {totalItems}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                        padding: '6px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        color: currentPage === 1 ? 'rgba(255,255,255,0.1)' : 'var(--text-primary)',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ChevronLeft size={18} />
                </button>

                <div style={{ display: 'flex', gap: '4px' }}>
                    {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        // For large number of pages, we might want to truncate, but for now simple list
                        if (totalPages > 7) {
                            if (pageNum > 2 && pageNum < totalPages - 1 && Math.abs(pageNum - currentPage) > 1) {
                                if (pageNum === 3 || pageNum === totalPages - 2) return <span key={pageNum}>...</span>;
                                return null;
                            }
                        }

                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    background: currentPage === pageNum ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    border: '1px solid',
                                    borderColor: currentPage === pageNum ? 'var(--primary)' : 'var(--border)',
                                    color: currentPage === pageNum ? 'white' : 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontWeight: currentPage === pageNum ? '700' : '400',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    style={{
                        padding: '6px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        color: (currentPage === totalPages || totalPages === 0) ? 'rgba(255,255,255,0.1)' : 'var(--text-primary)',
                        cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default PaginationControls;
