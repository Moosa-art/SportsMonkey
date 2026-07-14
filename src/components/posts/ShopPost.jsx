import './posts.css';

export default function ShopPost({ data }) {
  return (
    <div className="sh-card">
      <div className="sh-header">
        <div className="sh-title">🛍️ Shop</div>
        <div className="sh-see-all">See all →</div>
      </div>
      <div className="sh-grid">
        {data.items?.map((item, i) => (
          <div key={i} className="sh-item">
            <div className="sh-img" style={item.bg ? { background: item.bg } : {}}>
              {item.emoji || '👕'}
            </div>
            <div className="sh-info">
              <div className="sh-name">{item.name}</div>
              <div className="sh-price-row">
                <div className="sh-price">{item.price}</div>
                {item.oldPrice && <div className="sh-old">{item.oldPrice}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
