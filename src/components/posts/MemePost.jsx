import './posts.css';
export default function MemePost({ data }) {
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', position: 'relative', background: '#000' }}>
      <img src={data.image} alt="" style={{ width: '100%', display: 'block' }} />
      {data.topText && (
        <div style={{
          position: 'absolute', top: 14, left: 0, right: 0, textAlign: 'center',
          color: '#fff', fontSize: 22, fontWeight: 900,
          textShadow: '2px 2px 0 #000,-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000',
          textTransform: 'uppercase', padding: '0 14px', letterSpacing: 1
        }}>{data.topText}</div>
      )}
      {data.bottomText && (
        <div style={{
          position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center',
          color: '#fff', fontSize: 22, fontWeight: 900,
          textShadow: '2px 2px 0 #000,-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000',
          textTransform: 'uppercase', padding: '0 14px', letterSpacing: 1
        }}>{data.bottomText}</div>
      )}
    </div>
  );
}
