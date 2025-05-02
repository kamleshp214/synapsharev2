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

function Nodes({ user, username }) {
  const [nodes, setNodes] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingNode, setEditingNode] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await axios.get("http://localhost:5000/api/nodes", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setNodes(response.data);
    } catch (err) {
      setError("Failed to fetch nodes.");
      console.error("Fetch nodes error:", err);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!user || !username) {
      setError("Please log in to post.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("codeSnippet", codeSnippet);
      if (file) formData.append("file", file);
      const res = await axios.post(
        "http://localhost:5000/api/nodes",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setNodes([...nodes, res.data]);
      setSuccess("Node posted successfully!");
      setTitle("");
      setDescription("");
      setCodeSnippet("");
      setFile(null);
      document.getElementById("fileInput").value = "";
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        `Failed to post node: ${err.response?.data?.error || err.message}`
      );
      console.error("Post node error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!user || !username || !editingNode) return;
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("codeSnippet", codeSnippet);
      if (file) formData.append("file", file);
      const res = await axios.put(
        `http://localhost:5000/api/nodes/${editingNode._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setNodes(nodes.map((n) => (n._id === editingNode._id ? res.data : n)));
      setSuccess("Node updated successfully!");
      setEditingNode(null);
      setTitle("");
      setDescription("");
      setCodeSnippet("");
      setFile(null);
      document.getElementById("fileInput").value = "";
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        `Failed to update node: ${err.response?.data?.error || err.message}`
      );
      console.error("Edit node error:", err);
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
      const node = nodes.find((n) => n._id === id);
      if (node.postedBy !== username) {
        setError("You can only delete your own nodes.");
        return;
      }
      await axios.delete(`http://localhost:5000/api/nodes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNodes(nodes.filter((n) => n._id !== id));
      setSuccess("Node deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete node.");
      console.error("Delete node error:", err);
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
        `http://localhost:5000/api/nodes/${id}/${type}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNodes(nodes.map((n) => (n._id === id ? response.data : n)));
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
        { postType: "node", postId: id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess("Node saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save node.");
      console.error("Save node error:", err);
    }
  };

  const handleShare = (id) => {
    const url = `${window.location.origin}/nodes/${id}`;
    navigator.clipboard.writeText(url);
    setSuccess("Link copied to clipboard!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleComment = async (nodeId) => {
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
      const node = nodes.find((n) => n._id === nodeId);
      const updatedComments = [
        ...(node.comments || []),
        { content: newComment, postedBy: username, createdAt: new Date() },
      ];
      const response = await axios.put(
        `http://localhost:5000/api/nodes/${nodeId}`,
        { comments: updatedComments },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNodes(nodes.map((n) => (n._id === nodeId ? response.data : n)));
      setNewComment("");
      setSuccess("Comment added successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to add comment.");
      console.error("Comment error:", err);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (node) => {
    setEditingNode(node);
    setTitle(node.title);
    setDescription(node.description);
    setCodeSnippet(node.codeSnippet || "");
    setFile(null);
    if (document.getElementById("fileInput"))
      document.getElementById("fileInput").value = "";
  };

  const toggleComments = (nodeId) => {
    setShowComments((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
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

  const getVoteStatus = (node) => {
    if (!user || !username) return { hasUpvoted: false, hasDownvoted: false };
    const vote = node.voters.find((v) => v.username === username);
    return {
      hasUpvoted: vote && vote.voteType === "upvote",
      hasDownvoted: vote && vote.voteType === "downvote",
    };
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Nodes Feed</h1>
      {user && username ? (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {success && <p className="text-green-500 mb-4">{success}</p>}
          <form
            onSubmit={editingNode ? handleEdit : handlePost}
            className="space-y-4"
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full p-2 border rounded"
              required
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="w-full p-2 border rounded h-24"
              required
            />
            <textarea
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder="Code Snippet (optional)"
              className="w-full p-2 border rounded h-24"
            />
            <input
              id="fileInput"
              type="file"
              accept="image/*,application/pdf,video/mp4,video/webm"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full p-2 border rounded"
            />
            {file && (
              <p className="text-sm">
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading ? "Posting..." : editingNode ? "Update" : "Post"}
            </button>
          </form>
          {editingNode && (
            <button
              onClick={() => {
                setEditingNode(null);
                setTitle("");
                setDescription("");
                setCodeSnippet("");
                setFile(null);
                document.getElementById("fileInput").value = "";
              }}
              className="mt-4 text-red-500 hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-500">Log in to post nodes.</p>
      )}
      <div className="space-y-4">
        {nodes.map((node) => {
          const { hasUpvoted, hasDownvoted } = getVoteStatus(node);
          return (
            <div key={node._id} className="bg-white shadow-md rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                  {node.postedBy.charAt(0)}
                </div>
                <span className="font-semibold">{node.postedBy}</span>
                <span className="text-gray-500 text-sm">
                  {new Date(node.createdAt).toLocaleString()}
                </span>
              </div>
              <h2 className="text-xl font-bold">{node.title}</h2>
              <p className="text-gray-700 mb-2">{node.description}</p>
              {node.codeSnippet && (
                <pre className="bg-gray-100 p-2 rounded mb-2 overflow-x-auto">
                  {node.codeSnippet}
                </pre>
              )}
              {node.fileUrl && (
                <div className="mb-2">
                  {node.fileUrl.endsWith(".pdf") ? (
                    <a
                      href={node.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Download PDF
                    </a>
                  ) : node.fileUrl.match(/\.(jpg|jpeg|png|gif)$/) ? (
                    <img
                      src={node.fileUrl}
                      alt="Attachment"
                      className="max-w-full h-auto rounded"
                    />
                  ) : node.fileUrl.match(/\.(mp4|webm)$/) ? (
                    <video controls className="max-w-full h-auto rounded">
                      <source src={node.fileUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : null}
                </div>
              )}
              <div className="flex items-center gap-4 mb-2">
                <button
                  onClick={() => handleVote(node._id, "upvote")}
                  className={`flex items-center gap-1 ${
                    hasUpvoted ? "text-green-700" : "text-green-500"
                  } hover:text-green-700`}
                >
                  <FaArrowUp /> {node.upvotes}
                </button>
                <button
                  onClick={() => handleVote(node._id, "downvote")}
                  className={`flex items-center gap-1 ${
                    hasDownvoted ? "text-red-700" : "text-red-500"
                  } hover:text-red-700`}
                >
                  <FaArrowDown /> {node.downvotes}
                </button>
              </div>
              {user && username && (
                <div className="flex gap-2">
                  {node.postedBy === username && (
                    <>
                      <button
                        onClick={() => startEditing(node)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(node._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleSave(node._id)}
                    className="text-yellow-500 hover:text-yellow-700"
                  >
                    <FaSave />
                  </button>
                  <button
                    onClick={() => handleShare(node._id)}
                    className="text-purple-500 hover:text-purple-700"
                  >
                    <FaShareAlt />
                  </button>
                  <button
                    onClick={() => toggleComments(node._id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaComment /> {node.comments?.length || 0}
                  </button>
                </div>
              )}
              {showComments[node._id] && (
                <div className="mt-2">
                  {node.comments?.length ? (
                    node.comments.map((c, i) => (
                      <div key={i} className="bg-gray-100 p-2 rounded mb-2">
                        <p className="text-sm">{c.content}</p>
                        <p className="text-xs text-gray-500">
                          {c.postedBy} -{" "}
                          {new Date(c.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No comments yet.</p>
                  )}
                  {user && username && (
                    <div className="flex gap-2 mt-2">
                      <input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 p-2 border rounded"
                      />
                      <button
                        onClick={() => handleComment(node._id)}
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                      >
                        Comment
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {nodes.length === 0 && (
          <p className="text-center text-gray-500">No nodes yet.</p>
        )}
      </div>
    </div>
  );
}

export default Nodes;
