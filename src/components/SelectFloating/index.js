import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Input from '../Input'

export default function SelectFloating({
    row,
    role,
    ranges = [],
    placeholder = 'Pilih',
    value = '',
    onSelect
}) {
    if (!row || row.__type === 'GROUP') return null

    const inputRef = useRef(null)
    const dropdownRef = useRef(null)

    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [rect, setRect] = useState(null)

    const filtered = ranges.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase())
    )

    /* ================= OPEN ================= */
    function openDropdown() {
        const r = inputRef.current?.getBoundingClientRect()
        if (!r) return

        setRect(r)
        setSearch('')
        setOpen(true)
    }

    /* ================= CLICK OUTSIDE ================= */
    useEffect(() => {
        function handleClick(e) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setOpen(false)
            }
        }

        if (open) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    return (
        <>
            {/* INPUT */}
            <div ref={inputRef}>
                <Input
                    placeholder={placeholder}
                    value={value}
                    readOnly
                    onClick={openDropdown}
                    style={{
                        padding: 0
                    }}
                />
            </div>

            {/* DROPDOWN PORTAL */}
            {open && rect &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        style={{
                            position: 'fixed',
                            top: rect.bottom + 6,
                            left: rect.left,
                            width: rect.width,
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            zIndex: 99999,
                            boxShadow: '0 4px 12px rgba(0,0,0,.15)'
                        }}
                    >
                        {/* SEARCH */}
                        <div style={{ padding: 8 }}>
                            <input
                                autoFocus
                                placeholder="Cari..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    height: 36,
                                    padding: '6px 10px',
                                    borderRadius: 6,
                                    border: '1px solid #ccc'
                                }}
                            />
                        </div>

                        {/* LIST */}
                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                            {filtered.map(item => (
                                <div
                                    key={item.value}
                                    onClick={() => {
                                        onSelect?.(item)
                                        setOpen(false)
                                    }}
                                    style={{
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                    onMouseEnter={e =>
                                        (e.currentTarget.style.background = '#f5f5f5')
                                    }
                                    onMouseLeave={e =>
                                        (e.currentTarget.style.background = 'transparent')
                                    }
                                >
                                    {item.title}
                                </div>
                            ))}

                            {filtered.length === 0 && (
                                <div style={{ padding: 12, color: '#999' }}>
                                    Tidak ada data
                                </div>
                            )}
                        </div>
                    </div>,
                    document.body
                )
            }
        </>
    )
}
