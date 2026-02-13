import { useState, useEffect } from 'react';
import Main, { popAlert } from '../../../../components/Main';
import AdminLayout from '../../../../components/AdminLayout';
import Card from '../../../../components/Card';
import Button from '../../../../components/Button';
import { Row, Col } from '../../../../components/Layout';
import Input from '../../../../components/Input';
import { AiFillEdit, AiFillDelete, AiOutlinePlus } from 'react-icons/ai';
import ActivityIndicator from '../../../../components/ActivityIndicator';
import { BUCKET } from '../../../../api/utils';

export default function FAQManagement(props) {
    const [allFaqData, setAllFaqData] = useState({
        generalInfo: [],
        bagongApps: [],
        passengerBaggage: [],
        payment: [],
        baggage: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [form, setForm] = useState({
        question: '',
        answer: '',
        category: 'generalInfo',
        maxHeight: '',
        answerType: 'text'
    });
    const [selectedCategory, setSelectedCategory] = useState('generalInfo');

    const categories = [
        { value: 'generalInfo', label: 'Informasi Umum' },
        { value: 'bagongApps', label: 'Bagong Apps' },
        { value: 'passengerBaggage', label: 'Penumpang & Barang Bawaan' },
        { value: 'payment', label: 'Pembayaran' },
        { value: 'baggage', label: 'Bagasi' }
    ];

    const answerTypes = [
        { value: 'text', label: 'Teks Biasa' },
        { value: 'html', label: 'HTML' },
        { value: 'list', label: 'List' }
    ];

    useEffect(() => {
        loadFAQData();
    }, []);

    async function loadFAQData() {
        try {
            const response = await fetch(`${BUCKET}/faq.json?t=${Date.now()}`);
            const result = await response.json();
            setAllFaqData(result.faq || {
                generalInfo: [],
                bagongApps: [],
                passengerBaggage: [],
                payment: [],
                baggage: []
            });
        } catch (e) {
            setAllFaqData({
                generalInfo: [],
                bagongApps: [],
                passengerBaggage: [],
                payment: [],
                baggage: []
            });
        } finally {
            setLoading(false);
        }
    }

    function handleEdit(category, index) {
        const item = allFaqData[category][index];
        const answer = item.answer;

        let answerType = 'text';
        let answerText = '';

        if (typeof answer === 'string') {
            answerType = 'text';
            answerText = answer;
        } else if (answer.type === 'html') {
            answerType = 'html';
            answerText = answer.content;
        } else if (answer.type === 'list') {
            answerType = 'list';
            answerText = answer.items.join('\n');
        }

        setEditingIndex(index);
        setEditingCategory(category);
        setForm({
            question: item.question,
            answer: answerText,
            category: category,
            maxHeight: item.maxHeight || '',
            answerType
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function handleDelete(category, index) {
        if (!confirm('Yakin ingin menghapus FAQ ini?')) return;

        setSaving(true);
        try {
            const newData = { ...allFaqData };
            newData[category] = newData[category].filter((_, i) => i !== index);

            const response = await fetch('/api/faq', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ faq: newData })
            });

            const result = await response.json();

            if (response.ok) {
                setAllFaqData(newData);
                popAlert({ message: 'FAQ berhasil dihapus', type: 'success' });
            } else {
                throw new Error(result.error);
            }
        } catch (e) {
            popAlert({ message: 'Gagal menghapus: ' + e.message });
        } finally {
            setSaving(false);
        }
    }

    async function handleSave() {
        if (!form.question || !form.answer) {
            popAlert({ message: 'Pertanyaan dan jawaban wajib diisi' });
            return;
        }

        setSaving(true);
        try {
            let answerData;

            if (form.answerType === 'text') {
                answerData = form.answer;
            } else if (form.answerType === 'html') {
                answerData = { type: 'html', content: form.answer };
            } else if (form.answerType === 'list') {
                answerData = {
                    type: 'list',
                    items: form.answer.split('\n').filter(item => item.trim())
                };
            }

            const newItem = {
                question: form.question,
                answer: answerData,
                maxHeight: form.maxHeight ? parseInt(form.maxHeight) : null
            };

            const newData = { ...allFaqData };

            if (editingIndex !== null && editingCategory) {
                // Update existing
                newData[editingCategory][editingIndex] = newItem;
            } else {
                // Add new
                if (!newData[form.category]) {
                    newData[form.category] = [];
                }
                newData[form.category].push(newItem);
            }

            const response = await fetch('/api/faq', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ faq: newData })
            });

            const result = await response.json();

            if (response.ok) {
                setAllFaqData(newData);
                popAlert({ message: 'FAQ berhasil disimpan', type: 'success' });
                handleCancel();
            } else {
                throw new Error(result.error);
            }
        } catch (e) {
            popAlert({ message: 'Gagal menyimpan: ' + e.message });
        } finally {
            setSaving(false);
        }
    }

    function handleCancel() {
        setEditingIndex(null);
        setEditingCategory(null);
        setForm({
            question: '',
            answer: '',
            category: 'generalInfo',
            maxHeight: '',
            answerType: 'text'
        });
    }

    return (
        <Main>
            <AdminLayout>
                <Card style={{ backgroundColor: '#f9f9f9', marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
                        {editingIndex !== null ? 'Edit FAQ' : 'Tambah FAQ Baru'}
                    </h3>

                    <Row>
                        <Col column={1} withPadding>
                            <Input
                                title="Pertanyaan"
                                placeholder="Masukkan pertanyaan"
                                value={form.question}
                                onChange={(value) => setForm({ ...form, question: value })}
                            />
                        </Col>
                    </Row>

                    <Row>
                        <Col column={2} withPadding>
                            <Input
                                title="Kategori"
                                placeholder="Pilih kategori"
                                value={categories.find(c => c.value === form.category)?.label}
                                suggestions={categories}
                                suggestionField="label"
                                onSuggestionSelect={(cat) => setForm({ ...form, category: cat.value })}
                                disabled={editingIndex !== null}
                            />
                        </Col>
                        <Col column={6} withPadding>
                            <Input
                                title="Tipe Jawaban"
                                placeholder="Pilih tipe"
                                value={answerTypes.find(t => t.value === form.answerType)?.label}
                                suggestions={answerTypes}
                                suggestionField="label"
                                onSuggestionSelect={(type) => setForm({ ...form, answerType: type.value })}
                            />
                        </Col>
                    </Row>

                    <Row>
                        <Col column={6} withPadding>
                            <Input
                                type="text"
                                multiline={6}
                                title="Jawaban"
                                placeholder={
                                    form.answerType === 'list'
                                        ? 'Masukkan setiap item dalam baris baru'
                                        : 'Masukkan jawaban'
                                }
                                value={form.answer}
                                onChange={(value) => setForm({ ...form, answer: value })}
                            />
                        </Col>
                    </Row>

                    <Row>
                        <Col column={2} withPadding>
                            <Input
                                title="Max Height (px) - Opsional"
                                placeholder="Contoh: 200"
                                value={form.maxHeight}
                                onChange={(value) => setForm({ ...form, maxHeight: value })}
                            />
                        </Col>
                    </Row>

                    <Row>
                        <Col column={1} withPadding>
                            <Button
                                title={editingIndex !== null ? 'Update FAQ' : 'Tambah FAQ'}
                                styles={Button.primary}
                                onClick={handleSave}
                                disabled={saving}
                                icon={editingIndex !== null ? <AiFillEdit /> : <AiOutlinePlus />}
                            />
                            {editingIndex !== null && (
                                <Button
                                    title="Batal"
                                    styles={Button.secondary}
                                    onClick={handleCancel}
                                    style={{ marginLeft: '10px' }}
                                />
                            )}
                        </Col>
                    </Row>
                </Card>

                <Row style={{ marginBottom: '20px' }}>
                    <Col column={2} withPadding>
                        <Input
                            title="Filter Kategori"
                            placeholder="Pilih kategori"
                            value={categories.find(c => c.value === selectedCategory)?.label}
                            suggestions={categories}
                            suggestionField="label"
                            onSuggestionSelect={(cat) => setSelectedCategory(cat.value)}
                        />
                    </Col>
                </Row>

                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
                    Daftar FAQ - {categories.find(c => c.value === selectedCategory)?.label} ({allFaqData[selectedCategory]?.length || 0})
                </h3>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <ActivityIndicator />
                    </div>
                ) : (
                    <>
                        {allFaqData[selectedCategory]?.map((item, index) => (
                            <Card key={index} style={{ marginBottom: '15px' }}>
                                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
                                    {item.question}
                                </h4>
                                <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                                    {typeof item.answer === 'string'
                                        ? item.answer.substring(0, 150) + (item.answer.length > 150 ? '...' : '')
                                        : item.answer.type === 'list'
                                            ? `List dengan ${item.answer.items?.length || 0} item`
                                            : 'HTML Content'
                                    }
                                </div>
                                <Row>
                                    <Button
                                        title="Edit"
                                        icon={<AiFillEdit />}
                                        small
                                        onClick={() => handleEdit(selectedCategory, index)}
                                        style={{ marginRight: '5px' }}
                                    />
                                    <Button
                                        title="Hapus"
                                        icon={<AiFillDelete />}
                                        small
                                        styles={Button.danger}
                                        onClick={() => handleDelete(selectedCategory, index)}
                                    />
                                </Row>
                            </Card>
                        ))}

                        {(!allFaqData[selectedCategory] || allFaqData[selectedCategory].length === 0) && (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#999',
                                backgroundColor: '#f9f9f9',
                                borderRadius: '8px'
                            }}>
                                <p>Belum ada FAQ untuk kategori ini. Tambahkan FAQ pertama!</p>
                            </div>
                        )}
                    </>
                )}
            </AdminLayout>
        </Main>
    );
}
