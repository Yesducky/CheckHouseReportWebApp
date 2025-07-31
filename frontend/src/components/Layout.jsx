import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-primary">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red/10 backdrop-blur-md border-b border-gray-200/50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center w-full h-20">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-3 justify-center w-full"
            >
                  <img src={logo} alt={`logo`}/>
            </motion.div>
          </div>
        </div>
      </motion.header>
      
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}