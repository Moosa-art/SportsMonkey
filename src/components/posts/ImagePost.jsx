import './posts.css';
export default function ImagePost({ data }) {
  return (
    <div className="img-post">
      <img src={data.url} alt="" />
    </div>
  );
}
