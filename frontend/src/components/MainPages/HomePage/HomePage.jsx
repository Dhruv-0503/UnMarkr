import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUpload, FiEdit, FiDownload, FiImage } from 'react-icons/fi';
import { FaReact, FaNodeJs, FaPython } from 'react-icons/fa';
import { SiTailwindcss, SiOpencv } from 'react-icons/si';

const HomePage = () => {
  const features = [
    {
      icon: <FiUpload className="text-3xl" />,
      title: "Easy Upload",
      desc: "Drag & drop or browse files in any format"
    },
    {
      icon: <FiEdit className="text-3xl" />,
      title: "Smart Editing",
      desc: "AI-powered text recognition & editing"
    },
    {
      icon: <FiDownload className="text-3xl" />,
      title: "Instant Download",
      desc: "Export in multiple formats with one click"
    }
  ];

  const techStack = [
    { icon: <FaReact className="text-4xl text-blue-500" />, name: "React" },
    { icon: <FaNodeJs className="text-4xl text-green-600" />, name: "Node.js" },
    { icon: <SiTailwindcss className="text-4xl text-cyan-400" />, name: "Tailwind" },
    { icon: <FaPython className="text-4xl text-yellow-500" />, name: "Python" },
    { icon: <SiOpencv className="text-4xl text-red-500" />, name: "OpenCV" }
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-100 overflow-hidden">
      {/* Floating animated circles */}
      <div className="fixed -z-0 w-full h-full overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * 100 - 50,
              y: Math.random() * 100 - 50,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{
              x: [null, Math.random() * 100 - 50],
              y: [null, Math.random() * 100 - 50],
              transition: {
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: "reverse"
              }
            }}
            className={`absolute rounded-full opacity-10 ${i % 2 ? 'bg-indigo-300' : 'bg-purple-300'}`}
            style={{
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20 mt-10"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-block mb-6"
          >
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
              <FiImage className="text-5xl text-purple-600" />
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Unmarkr
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Transform images into editable text with <span className="font-semibold text-purple-600">AI-powered precision</span> in seconds!
          </motion.p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex justify-center gap-4 mb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Link to='/login'>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -10px rgba(124, 58, 237, 0.5)" }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-semibold shadow-lg"
            >
              Get Started - It's Free
            </motion.button>
          </Link>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3 bg-white text-gray-800 rounded-full font-semibold shadow-lg border border-gray-200"
          >
            See Demo
          </motion.button>
        </motion.div>

        {/* Features */}
        <motion.div
          className="grid md:grid-cols-3 gap-8 mb-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
              className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <div className="text-purple-600 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Tech Stack */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Powered By</h2>
          <p className="text-gray-600 mb-8">Cutting-edge technologies for best performance</p>

          <div className="flex flex-wrap justify-center gap-8">
            {techStack.map((tech, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.1 }}
                className="flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * i }}
              >
                {tech.icon}
                <span className="mt-2 text-gray-700">{tech.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          className="text-center bg-gradient-to-r from-indigo-100 to-purple-100 rounded-3xl p-12 shadow-inner border border-white/30"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to transform your images?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">Join thousands of users who save hours every week with our powerful OCR technology</p>
          <Link to='/login'>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -10px rgba(124, 58, 237, 0.5)" }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-semibold shadow-lg text-lg"
            >
              Start Processing Images Now
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default HomePage;