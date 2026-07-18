import React from 'react';
import { useParams, Link } from 'react-router-dom';
import './BlogPost.css';

// Import blog post content
import post1 from './posts/post1';
import post2 from './posts/post2';
import post3 from './posts/post3';
import post4 from './posts/post4';
import post5 from './posts/post5';
import post6 from './posts/post6';
import post7 from './posts/post7';

const blogPosts = {
  'the-future-of-democratic-ai-governance': post1,
  'how-blockchain-technology-ensures-transparent-ai-decisions': post2,
  'the-council-of-12-ais-a-new-model-for-ai-safety': post3,
  'ensemble-ai-decision-making-paradigm-shift': post4,
  'why-government-bodies-need-democratic-ai-governance': post5,
  'from-centralized-to-decentralized-evolution-of-ai-governance': post6,
  'case-study-democratic-ai-revolutionized-fair-decision-making': post7
};

function BlogPost() {
  const { slug } = useParams();
  const post = blogPosts[slug];

  if (!post) {
    return (
      <div className="blog-post-container">
        <div className="blog-post-not-found">
          <h1>Blog Post Not Found</h1>
          <p>Sorry, we couldn't find the blog post you're looking for.</p>
          <Link to="/blog" className="back-to-blog">← Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-post-container">
      <article className="blog-post">
        <Link to="/blog" className="back-to-blog">← Back to Blog</Link>
        
        <header className="blog-post-header">
          <h1>{post.title}</h1>
          <div className="blog-post-meta">
            <span className="blog-post-author">By {post.author}</span>
            <span className="blog-post-date">{post.date}</span>
            <span className="blog-post-read-time">{post.readTime}</span>
          </div>
          <p className="blog-post-description">{post.description}</p>
        </header>

        <div className="blog-post-content" dangerouslySetInnerHTML={{ __html: post.content }} />

        <footer className="blog-post-footer">
          <div className="blog-post-tags">
            {post.keywords && post.keywords.split(', ').map((keyword, index) => (
              <span key={index} className="blog-tag">{keyword}</span>
            ))}
          </div>
          <div className="blog-post-share">
            <h4>Share this article</h4>
            <div className="share-buttons">
              <button className="share-btn twitter">Twitter</button>
              <button className="share-btn linkedin">LinkedIn</button>
              <button className="share-btn facebook">Facebook</button>
            </div>
          </div>
        </footer>

        <div className="blog-post-cta">
          <h3>Ready to implement democratic AI governance?</h3>
          <p>Join leading organizations using councilof.ai for transparent, accountable AI decisions.</p>
          <Link to="/#demo" className="cta-btn">Try Interactive Demo</Link>
        </div>
      </article>
    </div>
  );
}

export default BlogPost;

