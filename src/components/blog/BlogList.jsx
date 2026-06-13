import React from 'react';
import { Link } from 'react-router-dom';
import './BlogList.css';

const blogPosts = [
  {
    id: 1,
    slug: 'the-future-of-democratic-ai-governance',
    title: 'The Future of Democratic AI Governance: Why a Council of AI Models Outperforms a Monolith',
    description: 'Explore how a multi-model, democratic approach to AI governance, inspired by ensemble learning, can build safer, fairer, and more robust AI systems.',
    date: '2025-10-21',
    author: 'Nicholas Templeman',
    readTime: '8 min read'
  },
  {
    id: 2,
    slug: 'how-blockchain-technology-ensures-transparent-ai-decisions',
    title: 'How Blockchain Technology Ensures Transparent AI Decisions',
    description: 'Discover how blockchain creates immutable audit trails for AI decisions, ensuring accountability and trust in democratic AI governance.',
    date: '2025-10-21',
    author: 'Nicholas Templeman',
    readTime: '7 min read'
  },
  {
    id: 3,
    slug: 'the-council-of-12-ais-a-new-model-for-ai-safety',
    title: 'The Council of 12 AIs: A New Model for AI Safety and Accountability',
    description: 'Learn how our revolutionary Council of 12 AIs provides unprecedented safety, accountability, and democratic oversight for AI systems.',
    date: '2025-10-21',
    author: 'Nicholas Templeman',
    readTime: '9 min read'
  },
  {
    id: 4,
    slug: 'ensemble-ai-decision-making-paradigm-shift',
    title: 'Ensemble AI Decision-Making: A Paradigm Shift for Enterprise and Government',
    description: 'Understand how ensemble learning principles applied to AI governance create more robust, accurate, and trustworthy decision-making systems.',
    date: '2025-10-21',
    author: 'Nicholas Templeman',
    readTime: '10 min read'
  },
  {
    id: 5,
    slug: 'why-government-bodies-need-democratic-ai-governance',
    title: 'Why Government Bodies Need Democratic AI Governance Now',
    description: 'Explore the critical importance of democratic AI governance for government agencies and public sector organizations.',
    date: '2025-10-21',
    author: 'Nicholas Templeman',
    readTime: '8 min read'
  },
  {
    id: 6,
    slug: 'from-centralized-to-decentralized-evolution-of-ai-governance',
    title: 'From Centralized to Decentralized: The Evolution of AI Governance',
    description: 'Trace the evolution of AI governance from centralized control to democratic, decentralized decision-making systems.',
    date: '2025-10-21',
    author: 'Nicholas Templeman',
    readTime: '9 min read'
  },
  {
    id: 7,
    slug: 'case-study-democratic-ai-revolutionized-fair-decision-making',
    title: 'Case Study: How Democratic AI Revolutionized Fair Decision-Making',
    description: 'Real-world examples of how democratic AI governance has transformed decision-making in enterprise and government settings.',
    date: '2025-10-21',
    author: 'Nicholas Templeman',
    readTime: '11 min read'
  }
];

function BlogList() {
  return (
    <div className="blog-container">
      <div className="blog-header">
        <h1>AI Governance Blog</h1>
        <p>Insights, research, and best practices for democratic AI governance</p>
      </div>

      <div className="blog-grid">
        {blogPosts.map(post => (
          <article key={post.id} className="blog-card">
            <div className="blog-card-content">
              <div className="blog-meta">
                <span className="blog-date">{post.date}</span>
                <span className="blog-read-time">{post.readTime}</span>
              </div>
              <h2>
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="blog-description">{post.description}</p>
              <div className="blog-footer">
                <span className="blog-author">By {post.author}</span>
                <Link to={`/blog/${post.slug}`} className="read-more">
                  Read More →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="blog-cta">
        <h3>Stay Updated</h3>
        <p>Get the latest insights on AI governance delivered to your inbox</p>
        <button className="subscribe-btn">Subscribe to Newsletter</button>
      </div>
    </div>
  );
}

export default BlogList;

