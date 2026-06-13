import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './BlogHub.css';
import blogPostsData from '../../data/blog-posts.json';

const BlogHub = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [blogPosts, setBlogPosts] = useState([]);
  const postsPerPage = 12;

  useEffect(() => {
    // Load all 76 blog posts from JSON
    setBlogPosts(blogPostsData);
  }, []);

  // Reset to page 1 when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const categories = [
    { id: 'all', name: 'All Posts', count: blogPosts.length },
    { id: 'councilof.ai', name: 'Democratic Governance', count: blogPosts.filter(p => p.category === 'councilof.ai').length },
    { id: 'proofof.ai', name: 'Deepfake Detection', count: blogPosts.filter(p => p.category === 'proofof.ai').length },
    { id: 'asisecurity.ai', name: 'ASI Security', count: blogPosts.filter(p => p.category === 'asisecurity.ai').length },
    { id: 'agisafe.ai', name: 'AGI Safety', count: blogPosts.filter(p => p.category === 'agisafe.ai').length },
    { id: 'suicidestop.ai', name: 'Mental Health AI', count: blogPosts.filter(p => p.category === 'suicidestop.ai').length },
    { id: 'transparencyof.ai', name: 'AI Transparency', count: blogPosts.filter(p => p.category === 'transparencyof.ai').length },
    { id: 'ethicalgovernanceof.ai', name: 'Ethical AI', count: blogPosts.filter(p => p.category === 'ethicalgovernanceof.ai').length },
    { id: 'safetyof.ai', name: 'AI Safety', count: blogPosts.filter(p => p.category === 'safetyof.ai').length },
    { id: 'accountabilityof.ai', name: 'AI Accountability', count: blogPosts.filter(p => p.category === 'accountabilityof.ai').length },
    { id: 'biasdetectionof.ai', name: 'Bias Detection', count: blogPosts.filter(p => p.category === 'biasdetectionof.ai').length },
    { id: 'dataprivacyof.ai', name: 'Data Privacy', count: blogPosts.filter(p => p.category === 'dataprivacyof.ai').length },
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getCategoryDisplayName = (category) => {
    const categoryMap = {
      'councilof.ai': 'COUNCILOF.AI',
      'proofof.ai': 'PROOFOF.AI',
      'asisecurity.ai': 'ASISECURITY.AI',
      'agisafe.ai': 'AGISAFE.AI',
      'suicidestop.ai': 'SUICIDESTOP.AI',
      'transparencyof.ai': 'TRANSPARENCYOF.AI',
      'ethicalgovernanceof.ai': 'ETHICALGOVERNANCEOF.AI',
      'safetyof.ai': 'SAFETYOF.AI',
      'accountabilityof.ai': 'ACCOUNTABILITYOF.AI',
      'biasdetectionof.ai': 'BIASDETECTIONOF.AI',
      'dataprivacyof.ai': 'DATAPRIVACYOF.AI'
    };
    return categoryMap[category] || category.toUpperCase();
  };

  return (
    <div className="blog-hub-page">
      <section className="blog-hero">
        <div className="container">
          <h1 className="gradient-text">AI Safety News & Insights</h1>
          <p className="subtitle">
            Expert perspectives on AI governance, safety, and the future of trustworthy AI systems
          </p>
          <p className="blog-count">
            <strong>{blogPosts.length} in-depth articles</strong> covering all aspects of AI safety across our 11-platform ecosystem
          </p>
        </div>
      </section>

      <section className="blog-content">
        <div className="container">
          <div className="blog-layout">
            {/* Sidebar */}
            <aside className="blog-sidebar">
              <div className="sidebar-section">
                <h3>Search</h3>
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="sidebar-section">
                <h3>Categories</h3>
                <ul className="category-list">
                  {categories.map(cat => (
                    <li key={cat.id}>
                      <button
                        className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        <span className="category-name">{cat.name}</span>
                        <span className="category-count">{cat.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="sidebar-section">
                <h3>Popular Tags</h3>
                <div className="tags-cloud">
                  <span className="tag">AI Governance</span>
                  <span className="tag">Deepfakes</span>
                  <span className="tag">EU AI Act</span>
                  <span className="tag">Blockchain</span>
                  <span className="tag">Ensemble Learning</span>
                  <span className="tag">AGI Safety</span>
                  <span className="tag">Bias Detection</span>
                  <span className="tag">Privacy</span>
                  <span className="tag">Transparency</span>
                  <span className="tag">Ethics</span>
                </div>
              </div>

              <div className="sidebar-section cta-box">
                <h3>Stay Updated</h3>
                <p>Get the latest AI safety insights delivered to your inbox</p>
                <input type="email" placeholder="Your email" className="email-input" />
                <button className="btn-primary">Subscribe</button>
              </div>
            </aside>

            {/* Main Content */}
            <main className="blog-main">
              {filteredPosts.length === 0 ? (
                <div className="no-results">
                  <h2>No articles found</h2>
                  <p>Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                <>
                  <div className="blog-grid">
                    {currentPosts.map(post => (
                      <article key={post.id} className="blog-card">
                        <div className="blog-card-header">
                          <span className="blog-category">{getCategoryDisplayName(post.category)}</span>
                          <span className="blog-date">{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <h2 className="blog-title">
                          <Link to={`/blog/${post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}>{post.title}</Link>
                        </h2>
                        <p className="blog-excerpt">{post.excerpt}</p>
                        <div className="blog-meta">
                          <span className="blog-author">By {post.author}</span>
                          <span className="blog-read-time">{post.readTime}</span>
                        </div>
                        {post.tags && post.tags.length > 0 && (
                          <div className="blog-tags">
                            {post.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="tag-small">{tag}</span>
                            ))}
                          </div>
                        )}
                        <Link to={`/blog/${post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`} className="read-more">
                          Read Full Article →
                        </Link>
                      </article>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="pagination-btn"
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                      >
                        ← Previous
                      </button>
                      <span className="pagination-info">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        className="pagination-btn"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* Contribute CTA */}
      <section className="contribute-cta">
        <div className="container">
          <h2>Want to Contribute?</h2>
          <p>We're looking for expert contributors to share insights on AI safety, governance, and ethics.</p>
          <Link to="/contact" className="btn-primary">Get in Touch</Link>
        </div>
      </section>
    </div>
  );
};

export default BlogHub;

