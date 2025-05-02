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
  FaComment,
} from "react-icons/fa";

function Discussions({ user, username }) {
  const [discussions, setDiscussions] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingDiscussion, setEditingDiscussion] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const fetchDiscussions = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await axios.get(
        "http://localhost:5000/api/discussions",
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      setDiscussions(response.data);
    } catch (err) {
      setError("Failed to fetch discussions.");
      console.error("Fetch discussions error:", err);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!user || !username) {
      setError("Please log in to post.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (file) formData.append("file", file);
      const res = await axios.post(
        "http://localhost:5000/api/discussions",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setDiscussions([...discussions, res.data]);
      setSuccess("Discussion posted successfully!");
      setTitle("");
      setContent("");
      setFile(null);
      document.getElementById("fileInput").value = "";
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        `Failed to post discussion: ${err.response?.data?.error || err.message}`
      );
      console.error("Post discussion error:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!user || !username || !editingDiscussion) return;
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (file) formData.append("file", file);
      const res = await axios.put(
        `http://localhost:5000/api/discussions/${editingDiscussion._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setDiscussions(
        discussions.map((d) => (d._id === editingDiscussion._id ? res.data : d))
      );
      setSuccess("Discussion updated successfully!");
      setEditingDiscussion(null);
      setTitle("");
      setContent("");
      setFile(null);
      document.getElementById("fileInput").value = "";
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        `Failed to update discussion: ${
          err.response?.data?.error || err.message
        }`
      );
      console.error("Edit discussion error:", err);
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
      const discussion = discussions.find((d) => d._id === id);
      if (discussion.postedBy !== username) {
        setError("You can only delete your own discussions.");
        return;
      }
      await axios.delete(`http://localhost:5000/api/discussions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDiscussions(discussions.filter((d) => d._id !== id));
      setSuccess("Discussion deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        `Failed to delete discussion: ${
          err.response?.data?.error || err.message
        }`
      );
      console.error("Delete discussion error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id, type) => {
    if (!user) {
      setError("Please log in to vote.");
      return;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await axios.post(
        `http://localhost:5000/api/discussions/${id}/${type}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDiscussions(
        discussions.map((d) => (d._id === id ? response.data : d))
      );
      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} successful!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        `Failed to ${type}: ${err.response?.data?.error || err.message}`
      );
      console.error("Vote error:", err.response?.data || err);
    }
  };

  const handleSave = async (id) => {
    if (!user) {
      setError("Please log in to save.");
      return;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.post(
        "http://localhost:5000/api/savedPosts",
        { postType: "discussion", postId: id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess("Discussion saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        `Failed to save discussion: ${err.response?.data?.error || err.message}`
      );
      console.error("Save discussion error:", err);
    }
  };

  const handleShare = (id) => {
    try {
      const url = `${window.location.origin}/discussions/${id}`;
      navigator.clipboard.writeText(url);
      setSuccess("Link copied to clipboard!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to copy link to clipboard.");
      console.error("Share error:", err);
    }
  };

  const handleComment = async (discussionId) => {
    if (!user || !username) {
      setError("Please log in to comment.");
      return;
    }
    if (!newComment.trim()) {
      setError("Comment cannot be empty.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await axios.post(
        `http://localhost:5000/api/discussions/${discussionId}/comment`,
        { content: newComment, postedBy: username },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDiscussions(
        discussions.map((d) => (d._id === discussionId ? response.data : d))
      );
      setNewComment("");
      setSuccess("Comment added successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        `Failed to add comment: ${err.response?.data?.error || err.message}`
      );
      console.error("Comment error:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (discussion) => {
    setEditingDiscussion(discussion);
    setTitle(discussion.title);
    setContent(discussion.content);
    setFile(null);
    if (document.getElementById("fileInput"))
      document.getElementById("fileInput").value = "";
  };

  const toggleComments = (discussionId) => {
    setShowComments((prev) => ({
      ...prev,
      [discussionId]: !prev[discussionId],
    }));
  };

  const getVoteStatus = (discussion) => {
    if (
      !user ||
      !username ||
      !discussion.voters ||
      !Array.isArray(discussion.voters)
    ) {
      return { hasUpvoted: false, hasDownvoted: false };
    }
    const vote = discussion.voters.find((v) => v.username === username);
    return {
      hasUpvoted: vote && vote.voteType === "upvote",
      hasDownvoted: vote && vote.voteType === "downvote",
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col relative">
      <div className="fixed inset-0 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950 dark:to-transparent opacity-50 -z-10"></div>
      <section className="py-12 text-center relative z-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
          Discussions
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Engage with the community, share ideas, and join vibrant
          conversations.
        </p>
      </section>
      {user && username ? (
        <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 mb-8 shadow-lg relative z-10">
          {error && (
            <p className="text-red-500 dark:text-red-400 mb-4 text-center">
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-500 dark:text-green-400 mb-4 text-center">
              {success}
            </p>
          )}
          <form
            onSubmit={editingDiscussion ? handleEdit : handlePost}
            className="space-y-6"
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Discussion Title"
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300"
              required
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent h-32 transition-all duration-300"
              required
            />
            <input
              id="fileInput"
              type="file"
              accept="image/*,application/pdf,video/mp4,video/webm"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800 transition-all duration-300"
            />
            {file && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            )}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 dark:bg-blue-500 text-white font-semibold py-3 px-6 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-700 transition-all duration-300 shadow-md"
              >
                {loading ? "Posting..." : editingDiscussion ? "Update" : "Post"}
              </button>
              {editingDiscussion && (
                <button
                  onClick={() => {
                    setEditingDiscussion(null);
                    setTitle("");
                    setContent("");
                    setFile(null);
                    document.getElementById("fileInput").value = "";
                  }}
                  className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-500 font-semibold py-3 px-6 rounded-full transition-all duration-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      ) : (
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8 relative z-10">
          Please log in to post discussions.
        </p>
      )}
      <section className="mb-auto space-y-8 relative z-10">
        {discussions.map((discussion) => {
          const { hasUpvoted, hasDownvoted } = getVoteStatus(discussion);
          return (
            <div
              key={discussion._id}
              className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-300 shadow-lg hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-blue-200 to-transparent dark:from-blue-900 dark:to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {discussion.postedBy.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {discussion.postedBy}
                  </span>
                  <span className="block text-sm text-gray-500 dark:text-gray-400">
                    {new Date(discussion.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {discussion.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {discussion.content}
              </p>
              {discussion.fileUrl && (
                <div className="mb-4">
                  {discussion.fileUrl.endsWith(".pdf") ? (
                    <a
                      href={discussion.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 dark:text-blue-400 hover:underline"
                    >
                      Download PDF
                    </a>
                  ) : discussion.fileUrl.match(/\.(jpg|jpeg|png|gif)$/) ? (
                    <img
                      src={discussion.fileUrl}
                      alt="Attachment"
                      className="max-w-full h-auto rounded-lg"
                    />
                  ) : discussion.fileUrl.match(/\.(mp4|webm)$/) ? (
                    <video controls className="max-w-full h-auto rounded-lg">
                      <source src={discussion.fileUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : null}
                </div>
              )}
              <div className="flex items-center gap-6 mb-4">
                <button
                  onClick={() => handleVote(discussion._id, "upvote")}
                  disabled={!user}
                  className={`flex items-center gap-2 z-10 pointer-events-auto ${
                    hasUpvoted
                      ? "text-green-700 dark:text-green-600"
                      : "text-green-500 dark:text-green-400"
                  } hover:text-green-600 dark:hover:text-green-500 disabled:text-gray-400 dark:disabled:text-gray-500 transition-all duration-300`}
                >
                  <FaArrowUp /> {discussion.upvotes}
                </button>
                <button
                  onClick={() => handleVote(discussion._id, "downvote")}
                  disabled={!user}
                  className={`flex items-center gap-2 z-10 pointer-events-auto ${
                    hasDownvoted
                      ? "text-red-700 dark:text-red-600"
                      : "text-red-500 dark:text-red-400"
                  } hover:text-red-600 dark:hover:text-red-500 disabled:text-gray-400 dark:disabled:text-gray-500 transition-all duration-300`}
                >
                  <FaArrowDown /> {discussion.downvotes}
                </button>
              </div>
              {user && username && (
                <div className="flex gap-4">
                  {discussion.postedBy === username && (
                    <>
                      <button
                        onClick={() => startEditing(discussion)}
                        disabled={loading}
                        className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-500 transition-all duration-300 z-10 pointer-events-auto"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(discussion._id)}
                        disabled={loading}
                        className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-500 transition-all duration-300 z-10 pointer-events-auto"
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleSave(discussion._id)}
                    disabled={!user}
                    className="text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-500 transition-all duration-300 z-10 pointer-events-auto"
                  >
                    <FaSave />
                  </button>
                  <button
                    onClick={() => handleShare(discussion._id)}
                    className="text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-500 transition-all duration-300 z-10 pointer-events-auto"
                  >
                    <FaShareAlt />
                  </button>
                  <button
                    onClick={() => toggleComments(discussion._id)}
                    className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-300 z-10 pointer-events-auto"
                  >
                    <FaComment /> {discussion.comments?.length || 0}
                  </button>
                </div>
              )}
              {showComments[discussion._id] && (
                <div className="mt-6">
                  {discussion.comments?.length ? (
                    discussion.comments.map((c, i) => (
                      <div
                        key={i}
                        className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-2"
                      >
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {c.content}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {c.postedBy} -{" "}
                          {new Date(c.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No comments yet.
                    </p>
                  )}
                  {user && username && (
                    <div className="flex gap-4 mt-4">
                      <input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                      />
                      <button
                        onClick={() => handleComment(discussion._id)}
                        disabled={loading}
                        className="bg-blue-600 dark:bg-blue-500 text-white font-semibold py-3 px-6 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-700 transition-all duration-300 shadow-md z-10 pointer-events-auto"
                      >
                        {loading ? "Commenting..." : "Comment"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {discussions.length === 0 && (
          <p className="text-center text-gray-600 dark:text-gray-300">
            No discussions yet.
          </p>
        )}
      </section>
    </div>
  );
}

export default Discussions;
