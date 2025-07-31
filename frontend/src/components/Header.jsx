import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

export default function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-lightred sticky top-0 left-0 right-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center w-full h-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-3 justify-center w-full"
          >
            <img src={logo} alt={`logo`} className="h-12 w-auto"/>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}