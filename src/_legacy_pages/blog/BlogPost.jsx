import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import blogPostsData from '../../data/blog-posts.json';
import './BlogPost.css';

function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    // Find post by slug
    const foundPost = blogPostsData.find(p => {
      const postSlug = p.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      return postSlug === slug;
    });
    
    setPost(foundPost);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (!post) {
    return (
      <div className="blog-post-container">
        <div className="blog-post-not-found">
          <h1>Post Not Found</h1>
          <p>The blog post you're looking for doesn't exist.</p>
          <Link to="/blog" className="back-to-blog">← Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-post-container">
      <div className="blog-post-header">
        <Link to="/blog" className="back-to-blog">← Back to Blog</Link>
        
        <div className="blog-post-meta">
          <span className="blog-post-category">{post.category}</span>
          <span className="blog-post-date">{post.date}</span>
          <span className="blog-post-read-time">{post.readTime} min read</span>
        </div>

        <h1 className="blog-post-title">{post.title}</h1>
        
        <div className="blog-post-author">
          <span>By {post.author}</span>
        </div>
      </div>

      <div className="blog-post-content">
        {post.content.split('\n\n').map((paragraph, index) => {
          // Check if it's a heading
          if (paragraph.startsWith('##')) {
            const headingText = paragraph.replace(/^##\s*/, '');
            return <h2 key={index}>{headingText}</h2>;
          } else if (paragraph.startsWith('#')) {
            const headingText = paragraph.replace(/^#\s*/, '');
            return <h1 key={index}>{headingText}</h1>;
          }
          
          // Regular paragraph
          return <p key={index}>{paragraph}</p>;
        })}
      </div>

      <div className="blog-post-footer">
        <div className="blog-post-tags">
          {post.tags && post.tags.map((tag, index) => (
            <span key={index} className="blog-post-tag">{tag}</span>
          ))}
        </div>

        <Link to="/blog" className="back-to-blog-bottom">← Back to All Posts</Link>
      </div>
    </div>
  );
}

export default BlogPost;

