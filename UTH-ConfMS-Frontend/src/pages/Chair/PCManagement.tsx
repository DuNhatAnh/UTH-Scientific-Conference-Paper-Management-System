import React, { useState, useEffect } from 'react';
import conferenceApi, { CommitteeMemberDto } from '../../services/conferenceApi';
import identityApi from '../../services/identityApi';
import { UserDto } from '../../services/authApi';

interface PCManagementProps {
    conferenceId?: string;
    onNavigate?: (view: any) => void;
}

export const PCManagement: React.FC<PCManagementProps> = ({ conferenceId, onNavigate }) => {
    const id = conferenceId;

    // Removed useNavigate since App does not use Router context
    const [members, setMembers] = useState<CommitteeMemberDto[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserDto[]>([]);
    const [loading, setLoading] = useState(false); // Global loading for page
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadMembers(id);
        }
    }, [id]);

    const loadMembers = async (conferenceId: string) => {
        setLoading(true);
        try {
            const res = await conferenceApi.getCommitteeMembers(conferenceId);
            if (res.success && res.data) {
                setMembers(res.data);
            }
        } catch (err) {
            console.error("Failed to load members", err);
            setError("Failed to load committee members.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearchLoading(true);
        try {
            const res = await identityApi.searchUsers(searchQuery);
            if (res.success && res.data) {
                setSearchResults(res.data.items);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleAddMember = async (user: UserDto) => {
        if (!id) return;
        try {
            const res = await conferenceApi.addCommitteeMember(id, user.id, 'REVIEWER');
            if (res.success) {
                // Refresh list
                loadMembers(id);
                // Clear search
                setSearchResults([]);
                setSearchQuery('');
                alert(`Added ${user.fullName} to committee.`);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to add member");
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!id || !window.confirm("Are you sure you want to remove this member?")) return;
        try {
            const res = await conferenceApi.removeCommitteeMember(id, userId);
            if (res.success) {
                setMembers(members.filter(m => m.userId !== userId));
            }
        } catch (err) {
            console.error(err);
            alert("Failed to remove member");
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">Program Committee Management</h1>
                <button onClick={() => onNavigate && onNavigate('chair-dashboard')} className="text-sec-light hover:text-main-light transition">
                    Back to Dashboard
                </button>
            </div>

            {/* ERROR */}
            {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* LEFT: Current Members */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">groups</span>
                        Current Members ({members.length})
                    </h2>

                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : members.length === 0 ? (
                        <div className="text-gray-500 italic text-center py-8">No members yet. Add some!</div>
                    ) : (
                        <ul className="space-y-3">
                            {members.map(member => (
                                <li key={member.memberId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        {/* Display Name fallback */}
                                        <div className="font-medium text-gray-900">{member.fullName || member.userId}</div>
                                        <div className="text-sm text-gray-500">{member.email || "No email"} • <span className="text-primary font-semibold">{member.role}</span></div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveMember(member.userId)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                                        title="Remove Member"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* RIGHT: Add New Member */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person_add</span>
                        Add Reviewer
                    </h2>

                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            placeholder="Enter email or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={searchLoading}
                            className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {searchLoading ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    {/* Search Results */}
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {searchResults.length > 0 ? (
                            searchResults.map(user => {
                                const isAdded = members.some(m => m.userId === user.id);
                                return (
                                    <div key={user.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-blue-50 transition">
                                        <div>
                                            <div className="font-medium">{user.fullName}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                        {isAdded ? (
                                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Added</span>
                                        ) : (
                                            <button
                                                onClick={() => handleAddMember(user)}
                                                className="text-sm bg-white border border-primary text-primary px-3 py-1 rounded hover:bg-primary hover:text-white transition"
                                            >
                                                Add
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        ) : searchQuery && !searchLoading && searchResults.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-gray-500 mb-2">User not found.</p>
                                <button className="text-primary font-medium hover:underline flex items-center justify-center gap-1 mx-auto">
                                    <span className="material-symbols-outlined text-[18px]">mail</span>
                                    Invite by Email
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};
