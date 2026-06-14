import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './Blog.css';

// This component can be used by all 11 platforms
// Just import and pass the platform name as a prop

const Blog = ({ platform }) => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load blog posts for this platform
    loadBlogPosts();
  }, [platform]);

  const loadBlogPosts = async () => {
    try {
      // In production, these would be loaded from your backend/CMS
      // For now, we'll use the generated blog posts
      const platformPosts = getBlogPostsForPlatform(platform);
      setPosts(platformPosts);
      setLoading(false);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      setLoading(false);
    }
  };

  const getBlogPostsForPlatform = (platformName) => {
    // This would be replaced with actual API calls in production
    // For now, return placeholder data
    return [
      {
        id: 1,
        slug: 'post-1',
        title: `The Future of ${platformName.replace(/-/g, ' ').toUpperCase()}`,
        description: 'Explore the latest developments and insights in AI safety and governance.',
        date: '2025-10-21',
        author: 'Nicholas Templeman',
        readTime: '8 min read',
        content: `# The Future of ${platformName}

This is a comprehensive article about the future of AI safety and governance.

## Key Points

- Revolutionary approach to AI safety
- Democratic governance principles
- Blockchain verification
- Ensemble learning methods

## Conclusion

The future of AI safety requires innovative solutions and collaborative approaches.`
      }
    ];
  };

  if (loading) {
    return (
      <div className="blog-container">
        <div className="blog-loading">Loading blog posts...</div>
      </div>
    );
  }

  if (selectedPost) {
    return (
      <div className="blog-container">
        <div className="blog-post">
          <button className="back-button" onClick={() => setSelectedPost(null)}>
            ← Back to Blog
          </button>
          <article>
            <header className="post-header">
              <h1>{selectedPost.title}</h1>
              <div className="post-meta">
                <span>{selectedPost.author}</span>
                <span>{selectedPost.date}</span>
                <span>{selectedPost.readTime}</span>
              </div>
            </header>
            <div className="post-content">
              <ReactMarkdown>{selectedPost.content}</ReactMarkdown>
            </div>
            <footer className="post-footer">
              <div className="share-buttons">
                <button>Share on Twitter</button>
                <button>Share on LinkedIn</button>
              </div>
            </footer>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-container">
      <header className="blog-header">
        <h1>Blog & Insights</h1>
        <p>Latest articles on AI safety, governance, and innovation</p>
      </header>

      <div className="blog-grid">
        {posts.map(post => (
          <article key={post.id} className="blog-card" onClick={() => setSelectedPost(post)}>
            <div className="card-content">
              <div className="card-meta">
                <span>{post.date}</span>
                <span>{post.readTime}</span>
              </div>
              <h2>{post.title}</h2>
              <p>{post.description}</p>
              <div className="card-footer">
                <span>By {post.author}</span>
                <span className="read-more">Read More →</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Blog;

