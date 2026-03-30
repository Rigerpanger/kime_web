import React from 'react';
import Button from '../UI/Button';
import { motion } from 'framer-motion';

const Contact = () => {
    return (
        <section id="contact" className="py-20 bg-obsidian text-center">
            <div className="container mx-auto px-6 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-charcoal to-obsidian p-12 rounded-3xl border border-white/5"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to create something amazing?</h2>
                    <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                        Whether you have a clear vision or just a rough idea, we're here to help you bring it to life. Let's talk.
                    </p>
                    <form className="space-y-4 max-w-md mx-auto text-left">
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Name</label>
                            <input type="text" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neonBlue outline-none transition-colors" placeholder="Your Name" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Email</label>
                            <input type="email" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neonBlue outline-none transition-colors" placeholder="your@email.com" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Message</label>
                            <textarea className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neonBlue outline-none transition-colors h-32" placeholder="Tell us about your project"></textarea>
                        </div>
                        <Button className="w-full">Send Message</Button>
                    </form>
                </motion.div>
            </div>
        </section>
    );
};

export default Contact;
