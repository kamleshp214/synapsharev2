import { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "../firebase";
import {
  FaEdit,
  FaTrash,
  FaSave,
  FaShareAlt,
  FaArrowUp,
  FaArrowDown,
  FaFile,
  FaFilePdf,
  FaFileImage,
  FaFileVideo,
} from "react-icons/fa";

function Notes({ user, username }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await axios.get("http://localhost:5000/api/notes", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setNotes(response.data);
    } catch (err) {
      setError("Failed to fetch notes.");
      console.error("Fetch notes error:", err);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!user || !username) {
      setError("Please log in to post.");
      return;
    }
    if (!title.trim() || !subject.trim()) {
      setError("Title and subject are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("title", title);
      formData.append("subject", subject);
      if (file) formData.append("file", file);
      const res = await axios.post(
        "http://localhost:5000/api/notes",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setNotes([...notes, res.data]);
      setSuccess("Note posted successfully!");
      setTitle("");
      setSubject("");
      setFile(null);
      document.getElementById("fileInput").value = "";
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        `Failed to post note: ${err.response?.data?.error || err.message}`
      );
      console.error("Post note error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!user || !username || !editingNote) return;
    if (!title.trim() || !subject.trim()) {
      setError("Title and subject are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("title", title);
      formData.append("subject", subject);
      if (file) formData.append("file", file);
      const res = await axios.put(
        `http://localhost:5000/api/notes/${editingNote._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setNotes(notes.map((n) => (n._id === editingNote._id ? res.data : n)));
      setSuccess("Note updated successfully!");
      setEditingNote(null);
      setTitle("");
      setSubject("");
      setFile(null);
      document.getElementById("fileInput").value = "";
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        `Failed to update note: ${err.response?.data?.error || err.message}`
      );
      console.error("Edit note error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!user || !username) {
      setError("Please log in to delete.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const note = notes.find((n) => n._id === id);
      if (note.uploadedBy !== username) {
        setError("You can only delete your own notes.");
        return;
      }
      await axios.delete(`http://localhost:5000/api/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(notes.filter((n) => n._id !== id));
      setSuccess("Note deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete note.");
      console.error("Delete note error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id, type) => {
    if (!user || !username) {
      setError("Please log in to vote.");
      return;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await axios.post(
        `http://localhost:5000/api/notes/${id}/${type}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotes(notes.map((n) => (n._id === id ? response.data : n)));
    } catch (err) {
      setError("Failed to vote.");
      console.error("Vote error:", err);
    }
  };

  const handleSave = async (id) => {
    if (!user || !username) {
      setError("Please log in to save.");
      return;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.post(
        "http://localhost:5000/api/savedPosts",
        { postType: "note", postId: id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess("Note saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save note.");
      console.error("Save note error:", err);
    }
  };

  const handleShare = (id) => {
    const url = `${window.location.origin}/notes/${id}`;
    navigator.clipboard.writeText(url);
    setSuccess("Link copied to clipboard!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const startEditing = (note) => {
    setEditingNote(note);
    setTitle(note.title);
    setSubject(note.subject);
    setFile(null);
    if (document.getElementById("fileInput"))
      document.getElementById("fileInput").value = "";
  };

  const handleFileDownload = (fileUrl, fileName) => {
    if (!fileUrl.startsWith("http://localhost:5000")) {
      setError("Invalid file URL");
      return;
    }
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (fileUrl) => {
    if (fileUrl.endsWith(".pdf")) {
      return <FaFilePdf className="text-red-500" />;
    } else if (fileUrl.match(/\.(jpg|jpeg|png|gif)$/)) {
      return <FaFileImage className="text-green-500" />;
    } else if (fileUrl.match(/\.(mp4|webm)$/)) {
      return <FaFileVideo className="text-blue-500" />;
    }
    return <FaFile className="text-gray-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-screen">
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950 dark:to-transparent opacity-50 -z-10"></div>

      <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-12 tracking-tight text-center relative z-10">
        Notes
      </h1>

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6 max-w-3xl mx-auto relative z-10">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 px-4 py-3 rounded-lg mb-6 max-w-3xl mx-auto relative z-10">
          {success}
        </div>
      )}

      {/* Create Note Form */}
      {user && username ? (
        <div className="group relative bg-white dark:bg-gray-900 rounded-2xl p-8 mb-12 max-w-3xl mx-auto border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-t from-blue-200 to-transparent dark:from-blue-900 dark:to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl"></div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 relative z-10">
            {editingNote ? "Edit Note" : "Share a Note"}
          </h2>
          <form
            onSubmit={editingNote ? handleEdit : handlePost}
            className="space-y-6 relative z-10"
          >
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter note title"
                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200"
                required
              />
            </div>
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Content
              </label>
              <textarea
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Write your note here..."
                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200 h-36 resize-none"
                required
              />
            </div>
            <div>
              <label
                htmlFor="fileInput"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Attachment (Optional)
              </label>
              <input
                id="fileInput"
                type="file"
                accept="image/*,application/pdf,video/mp4,video/webm"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition duration-200"
              />
            </div>
            {file && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            )}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 dark:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 shadow-md disabled:bg-blue-300 disabled:dark:bg-blue-800 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Processing..."
                  : editingNote
                  ? "Update Note"
                  : "Post Note"}
              </button>
              {editingNote && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingNote(null);
                    setTitle("");
                    setSubject("");
                    setFile(null);
                    document.getElementById("fileInput").value = "";
                  }}
                  className="px-6 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        <div className="group relative bg-white dark:bg-gray-900 rounded-2xl p-8 mb-12 max-w-3xl mx-auto border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-t from-blue-200 to-transparent dark:from-blue-900 dark:to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl"></div>
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-center relative z-10">
            Log in to share your notes with the community.
          </p>
          <div className="text-center relative z-10">
            <a
              href="/login"
              className="inline-block bg-blue-600 dark:bg-blue-500 text-white font-semibold py-3 px-8 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 shadow-md"
            >
              Log In
            </a>
          </div>
        </div>
      )}

      {/* Notes Feed */}
      <div className="space-y-8 max-w-3xl mx-auto pb-24">
        {notes.length === 0 ? (
          <div className="group relative bg-white dark:bg-gray-900 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-200 to-transparent dark:from-blue-900 dark:to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl"></div>
            <p className="text-gray-600 dark:text-gray-300 relative z-10">
              No notes yet. Be the first to share!
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note._id}
              className="group relative bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-blue-200 to-transparent dark:from-blue-900 dark:to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {note.uploadedBy.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {note.uploadedBy}
                    </span>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {note.title}
                </h2>

                <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">
                  {note.subject}
                </p>

                {note.fileUrl && (
                  <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    {note.fileUrl.endsWith(".pdf") ? (
                      <a
                        href={note.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={(e) => {
                          e.preventDefault();
                          handleFileDownload(
                            note.fileUrl,
                            `${note.title.replace(/\s+/g, "_")}.pdf`
                          );
                        }}
                      >
                        <FaFilePdf className="text-red-500" size={24} />
                        <span>Download PDF</span>
                      </a>
                    ) : note.fileUrl.match(/\.(jpg|jpeg|png|gif)$/) ? (
                      <div className="relative">
                        <img
                          src={note.fileUrl}
                          alt="Attachment"
                          className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                      </div>
                    ) : note.fileUrl.match(/\.(mp4|webm)$/) ? (
                      <div className="relative rounded-lg overflow-hidden">
                        <video controls className="max-w-full h-auto w-full">
                          <source src={note.fileUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : (
                      <a
                        href={note.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={(e) => {
                          e.preventDefault();
                          handleFileDownload(
                            note.fileUrl,
                            note.title.replace(/\s+/g, "_")
                          );
                        }}
                      >
                        <FaFile size={24} />
                        <span>Download Attachment</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Voting and Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 mt-4 border-t border-gray-100 dark:border-gray-600 pt-4">
                  <button
                    onClick={() => handleVote(note._id, "upvote")}
                    disabled={!user || note.voters?.includes(username)}
                    className={`flex items-center gap-2 py-2 px-4 rounded-lg 
                      ${
                        !user || note.voters?.includes(username)
                          ? "text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                          : "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 bg-white dark:bg-gray-800"
                      } 
                      transition-all duration-200`}
                  >
                    <FaArrowUp /> <span>{note.upvotes}</span>
                  </button>

                  <button
                    onClick={() => handleVote(note._id, "downvote")}
                    disabled={!user || note.voters?.includes(username)}
                    className={`flex items-center gap-2 py-2 px-4 rounded-lg 
                      ${
                        !user || note.voters?.includes(username)
                          ? "text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                          : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 bg-white dark:bg-gray-800"
                      } 
                      transition-all duration-200`}
                  >
                    <FaArrowDown /> <span>{note.downvotes}</span>
                  </button>

                  {user && username && (
                    <div className="flex gap-2 ml-auto">
                      <button
                        onClick={() => handleShare(note._id)}
                        className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200"
                        title="Share"
                      >
                        <FaShareAlt />
                      </button>
                      <button
                        onClick={() => handleSave(note._id)}
                        className="p-2 rounded-lg text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-all duration-200"
                        title="Save"
                      >
                        <FaSave />
                      </button>
                      {note.uploadedBy === username && (
                        <>
                          <button
                            onClick={() => startEditing(note)}
                            className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(note._id)}
                            className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notes;
