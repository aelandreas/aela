type CardProps = {
  header: string;
  text?: string;
  children?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
};

const Card: React.FC<CardProps> = ({
  header,
  text,
  children,
  selected,
  onClick,
}) => (
  <div
    onClick={onClick && onClick}
    className={selected ? 'neu card selected' : 'neu card'}
  >
    <div className="card-header">{header}</div>
    {text && <div className="card-text">{text}</div>}
    {children}
  </div>
);

export default Card;
