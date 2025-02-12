import { MdSlideshow } from 'react-icons/md';

interface SlideIconProps {
  className?: string;
  size?: number;
  color?: string;
}

const SlideIcon: React.FC<SlideIconProps> = ({ 
  className = 'text-gray-400',
  size = 80, // equivalent to w-20 h-20
  color
}) => (
  <MdSlideshow 
    className={className}
    size={size}
    color={color}
  />
);

export default SlideIcon;
