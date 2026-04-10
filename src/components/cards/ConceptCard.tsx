import { motion } from 'framer-motion'

interface ConceptCardProps {
  title: string
  content: string
  emoji?: string
}

export default function ConceptCard({ title, content, emoji = '📝' }: ConceptCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{emoji}</span>
        <h3 className="font-semibold text-base">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
    </motion.div>
  )
}
